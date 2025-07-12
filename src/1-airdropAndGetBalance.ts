import {
  createKeyPairSignerFromBytes,
  createSolanaRpc,
  devnet,
  lamports,
} from "@solana/kit";
import fs from "fs";
import { setWhirlpoolsConfig, setDefaultFunder } from "@orca-so/whirlpools";

export async function initialiseKeyPairAndAirdropAndGetBalance() {
  const devnetRpc = createSolanaRpc(devnet("https://api.devnet.solana.com"));
  const keyPairBytes = new Uint8Array(
    JSON.parse(
      fs.readFileSync("/home/jogeshwar/.config/solana/id.json", "utf-8")
    )
  );

  const wallet = await createKeyPairSignerFromBytes(keyPairBytes);
  console.log("Wallet: ", wallet.address);

  devnetRpc.requestAirdrop(wallet.address, lamports(1000000000n)).send();
  console.log("Airdrop 1 SOL to ", wallet.address);

  const balance = await devnetRpc.getBalance(wallet.address).send();
  console.log("Balance: ", balance);

  await setWhirlpoolsConfig("solanaDevnet");
  setDefaultFunder(wallet);
}
