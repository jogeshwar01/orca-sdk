import {
  address,
  createKeyPairSignerFromBytes,
  createSolanaRpc,
  lamports,
} from "@solana/kit";
import { getTransferSolInstruction } from "@solana-program/system";
import { buildAndSendTransaction, setRpc } from "@orca-so/tx-sender";
import fs from "fs";

export async function sendSol() {
  // Initialize a connection to the RPC and read in private key
  await setRpc("https://api.devnet.solana.com");

  const wallet = await createKeyPairSignerFromBytes(
    new Uint8Array(
      JSON.parse(
        fs.readFileSync("/home/jogeshwar/.config/solana/id.json", "utf-8")
      )
    )
  );

  console.log("wallet:", wallet.address);

  const rpc = createSolanaRpc("https://api.devnet.solana.com");
  const solBalance = await rpc.getBalance(wallet.address).send();
  console.log("balacne", solBalance);

  // SOL destination
  const destAddress = address("Htg9cXNdSrP37Q1ZJqsewMoMTdBfkrRHYYm3F1EJj5Uk");

  // Amount to send
  const amount = 10_000_000n; // lamports = 0.01 SOL

  // Build the instruction to send SOL
  const instruction = getTransferSolInstruction({
    amount: lamports(amount),
    source: wallet,
    destination: destAddress,
  });

  // Send the transaction
  console.log("Sending the transaction using Orca's tx-sender...");
  const txHash = await buildAndSendTransaction([instruction], wallet);
  console.log("txHash:", txHash);
}
