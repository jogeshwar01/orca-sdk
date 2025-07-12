import { address, createSolanaRpc } from "@solana/kit";
import { fetchPosition, fetchWhirlpool } from "@orca-so/whirlpools-client";

import { setPayerFromBytes, setRpc } from "@orca-so/whirlpools";
import bs58 from "bs58";

export async function getPositionByAddress() {
  // Initialize a connection to the RPC
  const rpc = createSolanaRpc("https://api.mainnet-beta.solana.com");
  await setRpc("https://api.mainnet-beta.solana.com");
  const privateKeyBytes = bs58.decode("<PRIVATE_KEY_HERE>");
  const signer = await setPayerFromBytes(privateKeyBytes);
  console.log("wallet address:", signer.address);

  // const positionMint = address("74XyhZGzYTR1CMfiwmE9RuwBRZ9h1fWxTujeSwXb3z8X");

  // Get the position and the pool to which the position belongs
  // const positionAddress = (await getPositionAddress(positionMint))[0];
  const positionAddress = address(
    "74XyhZGzYTR1CMfiwmE9RuwBRZ9h1fWxTujeSwXb3z8X"
  );
  const position = await fetchPosition(rpc, positionAddress);
  console.log("position:", position);

  const whirlpoolAddress = position.data.whirlpool;
  const whirlpool = await fetchWhirlpool(rpc, whirlpoolAddress);
  console.log("whirlpool:", whirlpool);
}
