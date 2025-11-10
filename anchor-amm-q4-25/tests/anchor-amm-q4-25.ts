import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createMint,
  mintTo,
  getAccount,
  createAssociatedTokenAccount
} from "@solana/spl-token";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram } from "@solana/web3.js";
import { BN } from "bn.js";
import { AnchorAmmQ425 } from "../target/types/anchor_amm_q4_25";

// Chai for assertions
import chai from "chai";
const expect = chai.expect;

describe("anchor-amm-q4-25", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.AnchorAmmQ425 as Program<AnchorAmmQ425>;
  const provider = anchor.getProvider();

  // Test wallets and tokens
  let initializer: Keypair;
  let user: Keypair;
  let mintX: PublicKey;
  let mintY: PublicKey;
  let config: PublicKey;
  let vaultX: PublicKey;
  let vaultY: PublicKey;
  let mintLp: PublicKey;
  let userTokenX: PublicKey;
  let userTokenY: PublicKey;
  let userLp: PublicKey;

  const SEED = new anchor.BN(1);
  const FEE = 25; // 0.25% fee
  const INITIAL_X = new anchor.BN(1000000); // 1,000,000 units of token X
  const INITIAL_Y = new anchor.BN(1000000); // 1,000,000 units of token Y

  before(async () => {
    // Create test wallets
    initializer = anchor.web3.Keypair.generate();
    user = anchor.web3.Keypair.generate();

    // Airdrop SOL to test wallets
    const signature = await provider.connection.requestAirdrop(
      initializer.publicKey,
      10 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature);

    const userSignature = await provider.connection.requestAirdrop(
      user.publicKey,
      10 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(userSignature);

    // Create token mints
    mintX = await createMint(
      provider.connection,
      initializer,
      initializer.publicKey,
      null,
      6 // 6 decimals
    );

    mintY = await createMint(
      provider.connection,
      initializer,
      initializer.publicKey,
      null,
      6 // 6 decimals
    );
  });

  it("Initialize AMM", async () => {
    // Derive PDA addresses
    [config] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("config"), SEED.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    [mintLp] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("lp"), config.toBuffer()],
      program.programId
    );

    // Get vault addresses (these are PDAs based on the config and mint addresses)
    vaultX = await getAssociatedTokenAddress(
      mintX,
      config,
      true // allowOwnerOffCurve
    );
    vaultY = await getAssociatedTokenAddress(
      mintY,
      config,
      true // allowOwnerOffCurve
    );

    // Initialize the AMM
    await program.methods
      .initialize(SEED, FEE, null)
      .accounts({
        initializer: initializer.publicKey,
        mintX: mintX,
        mintY: mintY,
        mintLp: mintLp,
        vaultX: vaultX,
        vaultY: vaultY,
        config: config,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      } as any) // Bypass TypeScript checking for now
      .signers([initializer])
      .rpc();

    // Verify the config account was created correctly
    const configAccount = await program.account.config.fetch(config);
    expect(configAccount.seed.toString()).to.equal(SEED.toString());
    expect(configAccount.fee).to.equal(FEE);
    expect(configAccount.locked).to.equal(false);
    expect(configAccount.mintX.toString()).to.equal(mintX.toString());
    expect(configAccount.mintY.toString()).to.equal(mintY.toString());
  });

  it("Deposit liquidity to initial pool", async () => {
    // Create user token accounts
    userTokenX = await getAssociatedTokenAddress(mintX, user.publicKey);
    userTokenY = await getAssociatedTokenAddress(mintY, user.publicKey);
    userLp = await getAssociatedTokenAddress(mintLp, user.publicKey);

    // Create associated token accounts for user if they don't exist
    await createAssociatedTokenAccount(
      provider.connection,
      initializer,
      mintX,
      user.publicKey
    );
    await createAssociatedTokenAccount(
      provider.connection,
      initializer,
      mintY,
      user.publicKey
    );
    await createAssociatedTokenAccount(
      provider.connection,
      initializer,
      mintLp,
      user.publicKey
    );

    // Mint tokens to user
    await mintTo(
      provider.connection,
      initializer,
      mintX,
      userTokenX,
      initializer.publicKey,
      INITIAL_X.toNumber()
    );
    await mintTo(
      provider.connection,
      initializer,
      mintY,
      userTokenY,
      initializer.publicKey,
      INITIAL_Y.toNumber()
    );

    // Deposit initial liquidity (first deposit creates the pool)
    const depositAmount = new anchor.BN(100000); // 100,000 LP tokens to mint
    const maxX = new anchor.BN(100000); // Maximum X tokens to deposit
    const maxY = new anchor.BN(100000); // Maximum Y tokens to deposit

    await program.methods
      .deposit(depositAmount, maxX, maxY)
      .accounts({
        user: user.publicKey,
        mintX: mintX,
        mintY: mintY,
        config: config,
        mintLp: mintLp,
        vaultX: vaultX,
        vaultY: vaultY,
        userX: userTokenX,
        userY: userTokenY,
        userLp: userLp,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      } as any) // Bypass TypeScript checking for now
      .signers([user])
      .rpc();

    // Verify vault balances increased
    const vaultXAccount = await getAccount(provider.connection, vaultX);
    const vaultYAccount = await getAccount(provider.connection, vaultY);
    expect(vaultXAccount.amount.toString()).to.equal(depositAmount.toString());
    expect(vaultYAccount.amount.toString()).to.equal(depositAmount.toString());

    // Verify user LP token balance
    const userLpAccount = await getAccount(provider.connection, userLp);
    expect(userLpAccount.amount.toString()).to.equal(depositAmount.toString());
  });

  it("Deposit additional liquidity", async () => {
    // Mint more tokens to user for additional deposit
    await mintTo(
      provider.connection,
      initializer,
      mintX,
      userTokenX,
      initializer.publicKey,
      100000
    );
    await mintTo(
      provider.connection,
      initializer,
      mintY,
      userTokenY,
      initializer.publicKey,
      100000
    );

    // Deposit additional liquidity
    const depositAmount = new anchor.BN(50000); // 50,000 LP tokens to mint
    const maxX = new anchor.BN(50000); // Maximum X tokens to deposit
    const maxY = new anchor.BN(50000); // Maximum Y tokens to deposit

    await program.methods
      .deposit(depositAmount, maxX, maxY)
      .accounts({
        user: user.publicKey,
        mintX: mintX,
        mintY: mintY,
        config: config,
        mintLp: mintLp,
        vaultX: vaultX,
        vaultY: vaultY,
        userX: userTokenX,
        userY: userTokenY,
        userLp: userLp,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      } as any) // Bypass TypeScript checking for now
      .signers([user])
      .rpc();

    // Verify vault balances increased
    const vaultXAccount = await getAccount(provider.connection, vaultX);
    const vaultYAccount = await getAccount(provider.connection, vaultY);
    expect(vaultXAccount.amount.toString()).to.equal("150000"); // 100,000 + 50,000
    expect(vaultYAccount.amount.toString()).to.equal("150000"); // 100,000 + 50,000

    // Verify user LP token balance increased
    const userLpAccount = await getAccount(provider.connection, userLp);
    expect(userLpAccount.amount.toString()).to.equal("150000"); // 100,000 + 50,000
  });

  it("Swap tokens X to Y", async () => {
    // Create a new user for swapping
    const swapper = anchor.web3.Keypair.generate();
    const swapperSignature = await provider.connection.requestAirdrop(
      swapper.publicKey,
      10 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(swapperSignature);

    // Create swapper token accounts
    const swapperTokenX = await getAssociatedTokenAddress(mintX, swapper.publicKey);
    const swapperTokenY = await getAssociatedTokenAddress(mintY, swapper.publicKey);

    await createAssociatedTokenAccount(
      provider.connection,
      initializer,
      mintX,
      swapper.publicKey
    );
    await createAssociatedTokenAccount(
      provider.connection,
      initializer,
      mintY,
      swapper.publicKey
    );

    // Mint tokens to swapper
    await mintTo(
      provider.connection,
      initializer,
      mintX,
      swapperTokenX,
      initializer.publicKey,
      10000
    );

    // Perform swap: swap 1000 X for Y with minimum 900 Y out (allowing for slippage and fees)
    const amountIn = new anchor.BN(1000);
    const minAmountOut = new anchor.BN(900); // Minimum Y tokens to receive

    await program.methods
      .swap(true, amountIn, minAmountOut) // true means swap X for Y
      .accounts({
        user: swapper.publicKey,
        mintX: mintX,
        mintY: mintY,
        config: config,
        vaultX: vaultX,
        vaultY: vaultY,
        userX: swapperTokenX,
        userY: swapperTokenY,
        tokenProgram: TOKEN_PROGRAM_ID,
      } as any) // Bypass TypeScript checking for now
      .signers([swapper])
      .rpc();

    // Verify vault balances changed (X increased, Y decreased)
    const vaultXAccount = await getAccount(provider.connection, vaultX);
    const vaultYAccount = await getAccount(provider.connection, vaultY);

    // X vault should have increased (but less than 1000 due to fees)
    expect(Number(vaultXAccount.amount)).to.be.greaterThan(150000);
    // Y vault should have decreased (but not by full amount due to fees and slippage)
    expect(Number(vaultYAccount.amount)).to.be.lessThan(150000);
  });

  it("Swap tokens Y to X", async () => {
    // Mint more Y tokens to user for swapping
    await mintTo(
      provider.connection,
      initializer,
      mintY,
      userTokenY,
      initializer.publicKey,
      10000
    );

    // Perform swap: swap 500 Y for X with minimum 400 X out
    const amountIn = new anchor.BN(500);
    const minAmountOut = new anchor.BN(400); // Minimum X tokens to receive

    await program.methods
      .swap(false, amountIn, minAmountOut) // false means swap Y for X
      .accounts({
        user: user.publicKey,
        mintX: mintX,
        mintY: mintY,
        config: config,
        vaultX: vaultX,
        vaultY: vaultY,
        userX: userTokenX,
        userY: userTokenY,
        tokenProgram: TOKEN_PROGRAM_ID,
      } as any) // Bypass TypeScript checking for now
      .signers([user])
      .rpc();

    // Verify vault balances changed (Y increased, X decreased)
    const vaultXAccount = await getAccount(provider.connection, vaultX);
    const vaultYAccount = await getAccount(provider.connection, vaultY);

    // Y vault should have increased (but less than 500 due to fees)
    expect(Number(vaultYAccount.amount)).to.be.greaterThan(149000); // previous amount
    // X vault should have decreased (but not by full amount due to fees and slippage)
    expect(Number(vaultXAccount.amount)).to.be.lessThan(151000); // previous amount
  });

  it("Withdraw liquidity", async () => {
    // Get current user LP balance
    const userLpAccount = await getAccount(provider.connection, userLp);
    const lpToWithdraw = new anchor.BN(Math.floor(Number(userLpAccount.amount) / 2)); // Withdraw half

    // Calculate minimum amounts to receive (with some slippage tolerance)
    const minWithdrawX = new anchor.BN(Math.floor(Number(userLpAccount.amount) / 2 * 0.99)); // 1% slippage tolerance
    const minWithdrawY = new anchor.BN(Math.floor(Number(userLpAccount.amount) / 2 * 0.99)); // 1% slippage tolerance

    await program.methods
      .withdraw(lpToWithdraw, minWithdrawX, minWithdrawY)
      .accounts({
        user: user.publicKey,
        mintX: mintX,
        mintY: mintY,
        config: config,
        mintLp: mintLp,
        vaultX: vaultX,
        vaultY: vaultY,
        userX: userTokenX,
        userY: userTokenY,
        userLp: userLp,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      } as any) // Bypass TypeScript checking for now
      .signers([user])
      .rpc();

    // Verify vault balances decreased
    const vaultXAccount = await getAccount(provider.connection, vaultX);
    const vaultYAccount = await getAccount(provider.connection, vaultY);
    expect(Number(vaultXAccount.amount)).to.be.lessThan(151000); // Should be less than before withdrawal
    expect(Number(vaultYAccount.amount)).to.be.lessThan(149500); // Should be less than before withdrawal

    // Verify user LP token balance decreased
    const newUserLpAccount = await getAccount(provider.connection, userLp);
    expect(Number(newUserLpAccount.amount)).to.be.lessThan(Number(userLpAccount.amount));
  });

  it("Test slippage protection on deposit", async () => {
    // Try to deposit with very tight slippage limits that should fail
    const user2 = anchor.web3.Keypair.generate();
    const user2Signature = await provider.connection.requestAirdrop(
      user2.publicKey,
      10 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(user2Signature);

    // Create user2 token accounts
    const user2TokenX = await getAssociatedTokenAddress(mintX, user2.publicKey);
    const user2TokenY = await getAssociatedTokenAddress(mintY, user2.publicKey);
    const user2Lp = await getAssociatedTokenAddress(mintLp, user2.publicKey);

    await createAssociatedTokenAccount(
      provider.connection,
      initializer,
      mintX,
      user2.publicKey
    );
    await createAssociatedTokenAccount(
      provider.connection,
      initializer,
      mintY,
      user2.publicKey
    );
    await createAssociatedTokenAccount(
      provider.connection,
      initializer,
      mintLp,
      user2.publicKey
    );

    // Mint tokens to user2
    await mintTo(
      provider.connection,
      initializer,
      mintX,
      user2TokenX,
      initializer.publicKey,
      10000
    );
    await mintTo(
      provider.connection,
      initializer,
      mintY,
      user2TokenY,
      initializer.publicKey,
      10000
    );

    // Try to deposit with slippage that's too tight - this should fail
    try {
      await program.methods
        .deposit(new anchor.BN(100000), new anchor.BN(1), new anchor.BN(100000)) // Very tight X limit
        .accounts({
          user: user2.publicKey,
          mintX: mintX,
          mintY: mintY,
          config: config,
          mintLp: mintLp,
          vaultX: vaultX,
          vaultY: vaultY,
          userX: user2TokenX,
          userY: user2TokenY,
          userLp: user2Lp,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        } as any) // Bypass TypeScript checking for now
        .signers([user2])
        .rpc();
      // If we reach here, the test failed
      expect.fail("Expected slippage error but transaction succeeded");
    } catch (error) {
      // Should fail with slippage exceeded error
      expect(error.message).to.include("SlippageExceeded");
    }
  });

  it("Test slippage protection on swap", async () => {
    // Try to swap with very tight slippage limits that should fail
    try {
      await program.methods
        .swap(true, new anchor.BN(100), new anchor.BN(1000000)) // Try to get way too much out
        .accounts({
          user: user.publicKey,
          mintX: mintX,
          mintY: mintY,
          config: config,
          vaultX: vaultX,
          vaultY: vaultY,
          userX: userTokenX,
          userY: userTokenY,
          tokenProgram: TOKEN_PROGRAM_ID,
        } as any) // Bypass TypeScript checking for now
        .signers([user])
        .rpc();
      // If we reach here, the test failed
      expect.fail("Expected slippage error but transaction succeeded");
    } catch (error) {
      // Should fail with slippage exceeded error
      expect(error.message).to.include("SlippageExceeded");
    }
  });

  it("Test invalid amount error", async () => {
    // Try to deposit with amount 0 - should fail
    try {
      await program.methods
        .deposit(new anchor.BN(0), new anchor.BN(1000), new anchor.BN(1000))
        .accounts({
          user: user.publicKey,
          mintX: mintX,
          mintY: mintY,
          config: config,
          mintLp: mintLp,
          vaultX: vaultX,
          vaultY: vaultY,
          userX: userTokenX,
          userY: userTokenY,
          userLp: userLp,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        } as any) // Bypass TypeScript checking for now
        .signers([user])
        .rpc();
      expect.fail("Expected invalid amount error but transaction succeeded");
    } catch (error) {
      expect(error.message).to.include("InvalidAmount");
    }

    // Try to withdraw with amount 0 - should fail
    try {
      await program.methods
        .withdraw(new anchor.BN(0), new anchor.BN(100), new anchor.BN(100))
        .accounts({
          user: user.publicKey,
          mintX: mintX,
          mintY: mintY,
          config: config,
          mintLp: mintLp,
          vaultX: vaultX,
          vaultY: vaultY,
          userX: userTokenX,
          userY: userTokenY,
          userLp: userLp,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        } as any) // Bypass TypeScript checking for now
        .signers([user])
        .rpc();
      expect.fail("Expected invalid amount error but transaction succeeded");
    } catch (error) {
      expect(error.message).to.include("InvalidAmount");
    }

    // Try to swap with amount 0 - should fail
    try {
      await program.methods
        .swap(true, new anchor.BN(0), new anchor.BN(100))
        .accounts({
          user: user.publicKey,
          mintX: mintX,
          mintY: mintY,
          config: config,
          vaultX: vaultX,
          vaultY: vaultY,
          userX: userTokenX,
          userY: userTokenY,
          tokenProgram: TOKEN_PROGRAM_ID,
        } as any) // Bypass TypeScript checking for now
        .signers([user])
        .rpc();
      expect.fail("Expected invalid amount error but transaction succeeded");
    } catch (error) {
      expect(error.message).to.include("InvalidAmount");
    }
  });

  it("Test pool locking functionality", async () => {
    // For this test, we would need to add a lock instruction to the program
    // Since the program doesn't have a lock instruction in the provided code,
    // we'll note that it requires additional functionality
    console.log("Pool locking functionality would require additional lock/unlock instructions in the program");
  });
});
