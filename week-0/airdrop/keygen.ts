import { createKeyPairFromBytes } from "@solana/kit";

(async () => {
  const keypair = await crypto.subtle.generateKey({ name: "Ed25519" }, true, [
    "sign",
    "verify",
  ]);
  const privateKeyJwk = await crypto.subtle.exportKey(
    "jwk",
    keypair.privateKey
  );
  const privateKeyBase64 = privateKeyJwk.d!;

  if (!privateKeyBase64) {
    throw new Error("Failed to get Private Key bytes");
  }

  const privateKeyBytes = new Uint8Array(
    Buffer.from(privateKeyBase64, "base64")
  );
  const publicKeyBytes = new Uint8Array(
    await crypto.subtle.exportKey("raw", keypair.publicKey)
  );
  const keypairBytes = new Uint8Array([...privateKeyBytes, ...publicKeyBytes]);

  const signer = await createKeyPairFromBytes(keypairBytes);

  console.log(`You have generated a new Solana wallet:
${signer.publicKey}`);

  console.log(`To save your wallet, copy and paste the following into a
JSON file: [${keypairBytes}]`);
})();

// import { Keypair } from "@solana/web3.js";

// const secretKey = Uint8Array.from([]);

// const keypair = Keypair.fromSecretKey(secretKey);
// console.log("Public address:", keypair.publicKey.toBase58());
