import { setWhirlpoolsConfig } from "@orca-so/whirlpools";
import {
  createKeyPairSignerFromBytes,
  createSolanaRpc,
  lamports,
} from "@solana/kit";
// import bs58 from "bs58";
import fs from "fs";

async function test() {
  const rpc = createSolanaRpc("https://api.devnet.solana.com");
  setWhirlpoolsConfig("solanaDevnet");

  // const keyBytes = bs58.decode("3kkYVuL7WVGqNwjibjopTXFCbPH7Q1cq79vLvbFJMu3EPqVqByTE3aQCPweMUuuwKEcG3rKHLZ3XXp1KyAvnXQVA");
  // const uarr = new Uint8Array(keyBytes);
  const keyBytes = new Uint8Array(
    JSON.parse(
      fs.readFileSync("/home/jogeshwar/.config/solana/id.json", "utf-8")
    )
  );

  const signer = await createKeyPairSignerFromBytes(keyBytes);
  const amount = lamports(1_000_000_000n);
  rpc.requestAirdrop(signer.address, amount).send();
}

test();
