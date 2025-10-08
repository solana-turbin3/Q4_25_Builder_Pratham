import { Commitment, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js"
import wallet from "../turbin3-wallet.json"
import { getOrCreateAssociatedTokenAccount, transfer } from "@solana/spl-token";

// We're going to import our keypair from the wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

//Create a Solana devnet connection
const commitment: Commitment = "confirmed";
const connection = new Connection("https://api.devnet.solana.com", commitment);

// Mint address
const mint = new PublicKey("9WDHbkKwSwEcsWbvMKRupmJNUkz16sTMPU1L544gwfDd");

// Recipient address
const to = new PublicKey("7qpCbG1WfLWsh4FhfoD5i5RbcVnFXuRbruG6ExhuRhe9");

(async () => {
    try {
        // Get the token account of the fromWallet address, and if it does not exist, create it
        const fromWallet = await getOrCreateAssociatedTokenAccount(connection, keypair, mint, keypair.publicKey);

        // Get the token account of the toWallet address, and if it does not exist, create it
        const toWallet = await getOrCreateAssociatedTokenAccount(connection, keypair, mint, keypair.publicKey);

        console.log(`From wallet ata: ${fromWallet.address.toBase58()}`);
        console.log(`To wallet ata: ${toWallet.address.toBase58()}`);
        // Transfer the new token to the "toTokenAccount" we just created
        const tx = transfer(
            connection,
            keypair,
            fromWallet.address,
            toWallet.address,
            keypair.publicKey,
            5n *  1_000_000n
        )
        console.log(`Transfer tx: ${await tx}`);

    } catch(e) {
        console.error(`Oops, something went wrong: ${e}`)
    }
})();