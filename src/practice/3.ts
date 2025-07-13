import { setWhirlpoolsConfig } from "@orca-so/whirlpools";
import {
  address,
  createKeyPairSignerFromBytes,
  createSolanaRpc,
} from "@solana/kit";
import { setRpc } from "@orca-so/tx-sender";
import {
  fetchToken,
  TOKEN_2022_PROGRAM_ADDRESS,
} from "@solana-program/token-2022";

// import bs58 from "bs58";
import fs from "fs";

async function test() {
  const rpc = createSolanaRpc("https://api.devnet.solana.com");
  setWhirlpoolsConfig("solanaDevnet");
  await setRpc("https://api.devnet.solana.com");

  const otherWallet = address("Htg9cXNdSrP37Q1ZJqsewMoMTdBfkrRHYYm3F1EJj5Uk");

  // const keyBytes = bs58.decode("3kkYVuL7WVGqNwjibjopTXFCbPH7Q1cq79vLvbFJMu3EPqVqByTE3aQCPweMUuuwKEcG3rKHLZ3XXp1KyAvnXQVA");
  // const uarr = new Uint8Array(keyBytes);
  const keyBytes = new Uint8Array(
    JSON.parse(
      fs.readFileSync("/home/jogeshwar/.config/solana/id.json", "utf-8")
    )
  );

  const signer = await createKeyPairSignerFromBytes(keyBytes);

  const accounts = await rpc
    .getTokenAccountsByOwner(
      signer.address,
      {
        programId: TOKEN_2022_PROGRAM_ADDRESS,
      },
      {
        encoding: "base64",
      }
    )
    .send();

  console.log("ac", accounts);

  accounts?.value?.forEach((account, index) => {
    console.log("val", index, " == >",  account.account);
  });
}

test();
