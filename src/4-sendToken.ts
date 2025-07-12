import {
  buildAndSendTransaction,
  setComputeUnitMarginMultiplier,
  setRpc,
} from "@orca-so/tx-sender";
import {
  address,
  createKeyPairSignerFromBytes,
  createSolanaRpc,
} from "@solana/kit";
import {
  findAssociatedTokenPda,
  TOKEN_2022_PROGRAM_ADDRESS,
  getTransferCheckedInstruction,
  getCreateAssociatedTokenInstruction,
} from "@solana-program/token-2022";

import fs from "fs";

export async function sendToken() {
  // Initialize a connection to the RPC and read in private key
  await setRpc("https://api.devnet.solana.com");
  setComputeUnitMarginMultiplier(3);

  const wallet = await createKeyPairSignerFromBytes(
    new Uint8Array(
      JSON.parse(
        fs.readFileSync("/home/jogeshwar/.config/solana/id.json", "utf-8")
      )
    )
  );
  console.log("wallet:", wallet.address);

  const tokenMint = address("Hxhz44Az821XATE94sA22h6AKnDtBQcgLBkdQnoxYZJf");
  const tokenDecimals = 1;

  // Destination wallet
  const destAddress = address("Htg9cXNdSrP37Q1ZJqsewMoMTdBfkrRHYYm3F1EJj5Uk");

  // Amount to send
  const amount = 10_000_000n;

  // Obtain the associated token account from the source wallet
  const [srcTokenAccount] = await findAssociatedTokenPda({
    owner: wallet.address,
    mint: tokenMint,
    tokenProgram: TOKEN_2022_PROGRAM_ADDRESS,
  });
  console.log("srcTokenAccount:", srcTokenAccount);

  // Obtain the associated token account for the destination wallet.
  const [destTokenAccount] = await findAssociatedTokenPda({
    owner: destAddress,
    mint: tokenMint,
    tokenProgram: TOKEN_2022_PROGRAM_ADDRESS,
  });

  console.log("destTokenAccount:", destTokenAccount);

  // Check if destination token account exists
  const rpc = createSolanaRpc("https://api.devnet.solana.com");
  const sourceAccountInfo = await rpc
    .getAccountInfo(srcTokenAccount, { encoding: "base64" })
    .send();

  // console.log("source account", sourceAccountInfo.value);

  const destAccountInfo = await rpc
    .getAccountInfo(destTokenAccount, { encoding: "base64" })
    .send();

  // console.log("dest account", destAccountInfo.value);

  // Prepare instructions
  const instructions = [];

  if (!destAccountInfo.value) {
    console.log(
      "Destination token account does not exist. Creating it first..."
    );
    // Add instruction to create associated token account for destination
    const createAtaInstruction = getCreateAssociatedTokenInstruction({
      payer: wallet,
      owner: destAddress,
      mint: tokenMint,
      ata: destTokenAccount,
    });
    instructions.push(createAtaInstruction);
  } else {
    console.log(
      "Destination token account exists. Proceeding with transfer..."
    );
  }

  // Create the instruction to send token
  const transferInstruction = getTransferCheckedInstruction({
    amount: amount,
    mint: tokenMint,
    source: srcTokenAccount,
    destination: destTokenAccount,
    decimals: tokenDecimals,
    authority: wallet.address,
  });
  instructions.push(transferInstruction);

  // Send the transaction
  console.log("Sending the transaction using Orca's tx-sender...");
  const txHash = await buildAndSendTransaction(instructions, wallet);
  console.log("txHash:", txHash);
}
