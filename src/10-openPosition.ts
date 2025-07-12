import {
  openFullRangePosition,
  setPayerFromBytes,
  setRpc,
  setWhirlpoolsConfig,
} from "@orca-so/whirlpools";
import { fetchWhirlpool } from "@orca-so/whirlpools-client";
import { sqrtPriceToPrice } from "@orca-so/whirlpools-core";
import {
  address,
  createSolanaRpc,
  createKeyPairSignerFromBytes,
} from "@solana/kit";
import fs from "fs";

export async function openPositionFn() {
  // Initialize a connection to the RPC and read in private key
  const rpc = createSolanaRpc("https://api.devnet.solana.com");
  await setRpc("https://api.devnet.solana.com");
  await setWhirlpoolsConfig("solanaDevnet");

  // Use keypair approach similar to createSplashPool.ts
  const keyPairBytes = new Uint8Array(
    JSON.parse(
      fs.readFileSync("/home/jogeshwar/.config/solana/id.json", "utf-8")
    )
  );
  const wallet = await createKeyPairSignerFromBytes(keyPairBytes);
  const signer = await setPayerFromBytes(keyPairBytes);
  console.log("signer:", signer.address);

  // Use the actual tokens and pool created in createSplashPool.ts
  const tokenA = {
    mint: address("5JTv7VHd1cJxEe6CzyJGjnKox2SnbuhDVG75Thu56sbx"),
    decimals: 6,
  };
  const tokenB = {
    mint: address("9khdEuvhj18wDFBEjFniH5iXymNEr8ZkrFBNbgxR6HJL"),
    decimals: 9,
  };
  const poolAddress = address("wu5xZMaqWCQGdZSPJAQEdXyNNZHh5a6NfVRkuG3rDCN");

  // Fetch the whirlpool using the pool address
  const whirlpool = await fetchWhirlpool(rpc, poolAddress);

  // Get the current price of the pool
  const currentPrice = sqrtPriceToPrice(
    whirlpool.data.sqrtPrice,
    tokenA.decimals,
    tokenB.decimals
  );
  console.log("current price:", currentPrice);

  // Set amount of tokens to deposit and acceptable slippage
  const tokenAAmount = 100n; // 10 tokens with 9 decimals
  const slippage = 100; // 100 bps = 1%

  // Create a transaction with correct function signature
  const {
    quote,
    positionMint,
    callback: sendTx,
  } = await openFullRangePosition(
    poolAddress,
    {
      tokenA: tokenAAmount,
    },
    slippage
  );

  // Send the transaction
  const txHash = await sendTx();

  console.log("Position mint:", positionMint);
  console.log("Quote:");
  console.log("  liquidity amount:", quote.liquidityDelta);
  console.log(
    "  estimated amount of tokenA to supply without slippage:",
    Number(quote.tokenEstA) / 10 ** tokenA.decimals
  );
  console.log(
    "  estimated amount of tokenB to supply without slippage:",
    Number(quote.tokenEstB) / 10 ** tokenB.decimals
  );
  console.log(
    "  amount of tokenA to supply if slippage is fully applied:",
    Number(quote.tokenMaxA) / 10 ** tokenA.decimals
  );
  console.log(
    "  amount of tokenB to supply if slippage is fully applied:",
    Number(quote.tokenMaxB) / 10 ** tokenB.decimals
  );
  console.log("TX hash:", txHash);
}


// signer: BGx1XuPKQ4vVTViN7ShUV7YizQPpsovPomsN41BB4h6t
// current price: 0.010000000000000002
// Jito tip is not supported on this chain. Skipping jito tip.
// Position mint: C4njzavvb4VW5gNXt9kd7TPhUXPuYXtMVmo8KCRn99Xj
// Quote:
//   liquidity amount: 316n
//   estimated amount of tokenA to supply without slippage: 0.0001
//   estimated amount of tokenB to supply without slippage: 0.000001
//   amount of tokenA to supply if slippage is fully applied: 0.000101
//   amount of tokenB to supply if slippage is fully applied: 0.00000101
// TX hash: 2bkpMX9mhwPYxo6W5zrqHayxMRvS9cxuftYybgC1yBpdDKmwWHb4nEFVyxM8ff7QmU4RFz7LNpGYP7ig6Vmp8zgd
