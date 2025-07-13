import { setWhirlpoolsConfig } from "@orca-so/whirlpools";
import {
  address,
  createKeyPairSignerFromBytes,
  createSolanaRpc,
  lamports,
} from "@solana/kit";
import { buildAndSendTransaction, setRpc } from "@orca-so/tx-sender";
import {
  fetchToken,
  TOKEN_2022_PROGRAM_ADDRESS,
  getTransferCheckedInstruction,
  findAssociatedTokenPda,
  getCreateAssociatedTokenInstruction,
} from "@solana-program/token-2022";

// import bs58 from "bs58";
import fs from "fs";

async function test() {
  const rpc = createSolanaRpc("https://api.devnet.solana.com");
  setWhirlpoolsConfig("solanaDevnet");
  await setRpc("https://api.devnet.solana.com");

  const otherWallet = address("Htg9cXNdSrP37Q1ZJqsewMoMTdBfkrRHYYm3F1EJj5Uk");
  const mint = address("Hxhz44Az821XATE94sA22h6AKnDtBQcgLBkdQnoxYZJf");

  // const keyBytes = bs58.decode("3kkYVuL7WVGqNwjibjopTXFCbPH7Q1cq79vLvbFJMu3EPqVqByTE3aQCPweMUuuwKEcG3rKHLZ3XXp1KyAvnXQVA");
  // const uarr = new Uint8Array(keyBytes);
  const keyBytes = new Uint8Array(
    JSON.parse(
      fs.readFileSync("/home/jogeshwar/.config/solana/id.json", "utf-8")
    )
  );

  const signer = await createKeyPairSignerFromBytes(keyBytes);

  const [srcPda, srcBump] = await findAssociatedTokenPda({
    owner: signer.address,
    tokenProgram: TOKEN_2022_PROGRAM_ADDRESS,
    mint: mint,
  });

  console.log("srcPda", srcPda);

  const srcAccountInfo = await rpc
    .getAccountInfo(srcPda, {
      commitment: "finalized",
      encoding: "base64",
    })
    .send();
  console.log("src info", srcAccountInfo);

  const [destPda, destBump] = await findAssociatedTokenPda({
    owner: otherWallet,
    tokenProgram: TOKEN_2022_PROGRAM_ADDRESS,
    mint: mint,
  });

  console.log("destPda", destPda);

  const destAccountInfo = await rpc
    .getAccountInfo(destPda, {
      commitment: "finalized",
      encoding: "base64",
    })
    .send();
  console.log("dest info", destAccountInfo);

  const instructions = [];
  if (!destAccountInfo.value) {
    const createPdaInstn = getCreateAssociatedTokenInstruction({
      payer: signer,
      ata: destPda,
      owner: otherWallet,
      mint: mint,
    });
    instructions.push(createPdaInstn);
  }

  const amount = lamports(10_000_000n);
  const instn = getTransferCheckedInstruction({
    source: srcPda,
    mint: mint,
    destination: destPda,
    authority: signer.address,
    amount: amount,
    decimals: 1,
  });

  instructions.push(instn);

  const sig = await buildAndSendTransaction(instructions, signer);
  console.log("sig", sig);
}

test();
