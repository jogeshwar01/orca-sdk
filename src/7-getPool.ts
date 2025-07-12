import { address, createSolanaRpc } from "@solana/kit";
import {
  fetchWhirlpool,
  getWhirlpoolAddress,
} from "@orca-so/whirlpools-client";
import { sqrtPriceToPrice } from "@orca-so/whirlpools-core";
import { setWhirlpoolsConfig } from "@orca-so/whirlpools";

export async function getPool() {
  const rpc = createSolanaRpc("https://api.mainnet-beta.solana.com");
  await setWhirlpoolsConfig("solanaMainnet");

  const tokenSOL = {
    mint: address("So11111111111111111111111111111111111111112"),
    decimals: 9,
  };
  const tokenUSDC = {
    mint: address("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
    decimals: 6,
  };

  const whirlpoolAddress = address(
    "Czfq3xZZDmsdGdUyrNLtRhGc47cXcZtLG4crryfu44zE"
  );
  const whirlpool = await fetchWhirlpool(rpc, whirlpoolAddress);
  const price = sqrtPriceToPrice(
    whirlpool.data.sqrtPrice,
    tokenSOL.decimals,
    tokenUSDC.decimals
  );
  console.log("whirlpoolAddress:", whirlpoolAddress);
  console.log("  sqrtPrice:", whirlpool.data.sqrtPrice);
  console.log("  price:", price);
}
