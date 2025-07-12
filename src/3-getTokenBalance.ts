import { createKeyPairSignerFromBytes, createSolanaRpc } from "@solana/kit";
import { TOKEN_PROGRAM_ADDRESS } from "@solana-program/token";
import {
  fetchToken,
  TOKEN_2022_PROGRAM_ADDRESS,
} from "@solana-program/token-2022";
import fs from "fs";

export async function getTokenBalance() {
  // Initialize a connection to the RPC and read in private key
  const rpc = createSolanaRpc("https://api.devnet.solana.com");
  const wallet = await createKeyPairSignerFromBytes(
    new Uint8Array(
      JSON.parse(
        fs.readFileSync("/home/jogeshwar/.config/solana/id.json", "utf-8")
      )
    )
  );

  // Obtain the token accounts from the wallet's public key
  //
  // {
  //   context: { apiVersion: '2.2.3', slot: 373019172n },
  //   value: [
  //     { account: [Object], pubkey: 'string' },
  //     { account: [Object], pubkey: 'string' },
  //     { account: [Object], pubkey: 'string' },
  //     { account: [Object], pubkey: 'string' }
  //   ]
  // }
  const accounts = await rpc
    .getTokenAccountsByOwner(
      wallet.address,
      { programId: TOKEN_PROGRAM_ADDRESS },
      { encoding: "base64" }
    )
    .send();
  // console.log("getTokenAccountsByOwner:", accounts);
  const accounts2022 = await rpc
    .getTokenAccountsByOwner(
      wallet.address,
      { programId: TOKEN_2022_PROGRAM_ADDRESS },
      { encoding: "base64" }
    )
    .send();
  // console.log("getTokenAccountsByOwner(2022):", accounts2022);
  const allAccounts = [...accounts.value, ...accounts2022.value];

  for (let i = 0; i < allAccounts.length; i++) {
    const value = allAccounts[i];

    // Fetch token account data
    const tokenData = await fetchToken(rpc, value.pubkey);

    // console.log("tokenData", tokenData);

    // Use the mint address to determine which token account is for which token
    const mint = tokenData.data.mint;

    // The balance is "amount"
    const amount = tokenData.data.amount;

    console.log(
      "TokenAccount:",
      value.pubkey,
      "\n  mint:",
      mint,
      "\n  amount:",
      amount
    );
  }
}
