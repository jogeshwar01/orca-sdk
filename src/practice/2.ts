import { setWhirlpoolsConfig } from "@orca-so/whirlpools";
import {
  address,
  createKeyPairSignerFromBytes,
  createSolanaRpc,
  lamports,
} from "@solana/kit";
import { getTransferSolInstruction } from "@solana-program/system";
import { buildAndSendTransaction, setComputeUnitMarginMultiplier, setRpc } from "@orca-so/tx-sender";

// import bs58 from "bs58";
import fs from "fs";

async function test() {
  const rpc = createSolanaRpc("https://api.devnet.solana.com");
  setWhirlpoolsConfig("solanaDevnet");
  await setRpc("https://api.devnet.solana.com");
  setComputeUnitMarginMultiplier(2);

  const otherWallet = address("Htg9cXNdSrP37Q1ZJqsewMoMTdBfkrRHYYm3F1EJj5Uk");

  // const keyBytes = bs58.decode("3kkYVuL7WVGqNwjibjopTXFCbPH7Q1cq79vLvbFJMu3EPqVqByTE3aQCPweMUuuwKEcG3rKHLZ3XXp1KyAvnXQVA");
  // const uarr = new Uint8Array(keyBytes);
  const keyBytes = new Uint8Array(
    JSON.parse(
      fs.readFileSync("/home/jogeshwar/.config/solana/id.json", "utf-8")
    )
  );

  const signer = await createKeyPairSignerFromBytes(keyBytes);
  const amount = lamports(100_000_000n);

  const transferInstruction = getTransferSolInstruction({
    source: signer,
    destination: otherWallet,
    amount: amount,
  });

  const signature = await buildAndSendTransaction(
    [transferInstruction],
    signer
  );
  console.log("sign", signature);
}

test();
