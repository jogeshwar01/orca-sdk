import {
  setPayerFromBytes,
  setRpc,
  setWhirlpoolsConfig,
  swap,
} from "@orca-so/whirlpools";
import { address, createKeyPairSignerFromBytes } from "@solana/kit";
import { getWhirlpoolAddress } from "@orca-so/whirlpools-client";
import bs58 from "bs58";

import fs from "fs";

export async function executeSwap() {
  // Initialize a connection to the RPC and read in private key
  await setRpc("https://api.mainnet-beta.solana.com");
  const privateKeyBytes = bs58.decode("<PRIVATE_KEY_HERE>");
  const signer = await setPayerFromBytes(privateKeyBytes);

  await setWhirlpoolsConfig("solanaMainnet");
  console.log("signer:", signer.address);

  // Token definition
  const tokenSOL = {
    mint: address("So11111111111111111111111111111111111111112"),
    decimals: 9,
  };
  const tokenUSDC = {
    mint: address("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
    decimals: 6,
  };

  // WhirlpoolsConfig account
  // Mainnet Orca Whirlpools - SOL-USDC
  // // the one on orca is the PDA itself so dont use that
  // const MAINNET_WHIRLPOOLS_CONFIG = address(
  //   "Czfq3xZZDmsdGdUyrNLtRhGc47cXcZtLG4crryfu44zE"
  // );
  // const whirlpoolConfigAddress = address(MAINNET_WHIRLPOOLS_CONFIG.toString());

  // // Get SOL-USDC whirlpool
  // // Whirlpools are identified by 5 elements (Program, Config, mint address of the 1st token,
  // // mint address of the 2nd token, tick spacing), similar to the 5 column compound primary key in DB
  // // Try different tick spacings for SOL-USDC pool
  // const tickSpacing = 1; // Most common for SOL-USDC concentrated liquidity pools
  // const [whirlpoolPda] = await getWhirlpoolAddress(
  //   whirlpoolConfigAddress,
  //   tokenSOL.mint,
  //   tokenUSDC.mint,
  //   tickSpacing
  // );
  // console.log("whirlpoolPda:", whirlpoolPda);

  const whirlpoolPda = address("Czfq3xZZDmsdGdUyrNLtRhGc47cXcZtLG4crryfu44zE");

  // Swap 0.1 USDC for SOL
  const amountIn = BigInt(100_000);

  // Obtain swap estimation (run simulation)
  const { quote, callback: sendTx } = await swap(
    // Input token and amount
    {
      mint: tokenUSDC.mint,
      inputAmount: amountIn, // swap 0.1 USDC to SOL
    },
    whirlpoolPda,
    // Acceptable slippage (100bps = 1%)
    100 // 100 bps = 1%
  );

  // Output the quote
  console.log("Quote:");
  console.log("  - Amount of tokens to pay:", quote.tokenIn);
  console.log(
    "  - Minimum amount of tokens to receive with maximum slippage:",
    quote.tokenMinOut
  );
  console.log("  - Estimated tokens to receive:");
  console.log("      Based on the price at the time of the quote");
  console.log("      Without slippage consideration:", quote.tokenEstOut);
  console.log("  - Trade fee (bps):", quote.tradeFee);

  // Send the transaction using action
  const swapSignature = await sendTx();
  console.log("swapSignature:", swapSignature);
}
