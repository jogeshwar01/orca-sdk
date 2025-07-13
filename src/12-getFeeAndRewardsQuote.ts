import {
  address,
  createKeyPairSignerFromBytes,
  createSolanaRpc,
} from "@solana/kit";
import {
  fetchAllTickArray,
  fetchPosition,
  fetchTickArray,
  fetchWhirlpool,
  getPositionAddress,
  getTickArrayAddress,
} from "@orca-so/whirlpools-client";

import {
  collectFeesQuote,
  collectRewardsQuote,
  getTickArrayStartTickIndex,
  getTickIndexInArray,
} from "@orca-so/whirlpools-core";
import bs58 from "bs58";

export async function getFeeAndRewardsQuote() {
  console.log("=== Starting Orca SDK Position Analysis ===");

  // Initialize a connection to the RPC
  console.log("Step 1: Initializing RPC connection...");
  const rpc = createSolanaRpc("https://api.mainnet-beta.solana.com");
  console.log("✓ RPC connection created");

  console.log("Step 2: Setting up wallet signer...");
  const privateKeyBase58 = "<key-here>";
  const privateKeyBytes = bs58.decode(privateKeyBase58);
  const signer = await createKeyPairSignerFromBytes(privateKeyBytes);
  console.log("✓ Wallet address:", signer.address);

  // Get the position and the pool to which the position belongs
  console.log("Step 4: Fetching position data...");
  const positionAddress = address(
    "AE5uQEDtMP4i5a2eP7CDpSnhbuScaEwy6kjA75Nz8AN5"
  );
  console.log("✓ Position address:", positionAddress);

  const position = await fetchPosition(rpc, positionAddress);
  console.log("✓ Position data fetched");
  console.log("  - Tick lower index:", position.data.tickLowerIndex);
  console.log("  - Tick upper index:", position.data.tickUpperIndex);
  console.log("  - Liquidity:", position.data.liquidity);

  console.log("Step 5: Fetching whirlpool data...");
  const whirlpoolAddress = position.data.whirlpool;
  console.log("✓ Whirlpool address:", whirlpoolAddress);

  const whirlpool = await fetchWhirlpool(rpc, whirlpoolAddress);
  console.log("✓ Whirlpool data fetched");
  console.log("  - Tick spacing:", whirlpool.data.tickSpacing);
  console.log("  - Current tick index:", whirlpool.data.tickCurrentIndex);

  // Get TickArray and Tick
  console.log("Step 6: Calculating tick array start indices...");
  const lowerTickArrayStartIndex = getTickArrayStartTickIndex(
    position.data.tickLowerIndex,
    whirlpool.data.tickSpacing
  );
  const upperTickArrayStartIndex = getTickArrayStartTickIndex(
    position.data.tickUpperIndex,
    whirlpool.data.tickSpacing
  );
  console.log("✓ Lower tick array start index:", lowerTickArrayStartIndex);
  console.log("✓ Upper tick array start index:", upperTickArrayStartIndex);

  console.log("Step 7: Getting tick array addresses...");
  const [lowerTickArrayAddress, upperTickArrayAddress] = await Promise.all([
    getTickArrayAddress(whirlpool.address, lowerTickArrayStartIndex).then(
      (x) => x[0]
    ),
    getTickArrayAddress(whirlpool.address, upperTickArrayStartIndex).then(
      (x) => x[0]
    ),
  ]);
  console.log("✓ Lower tick array address:", lowerTickArrayAddress);
  console.log("✓ Upper tick array address:", upperTickArrayAddress);

  console.log("Step 8: Fetching tick arrays...");
  const [lowerTickArray, upperTickArray] = await fetchAllTickArray(rpc, [
    lowerTickArrayAddress,
    upperTickArrayAddress,
  ]);
  console.log("✓ Tick arrays fetched");
  console.log(
    "  - Lower tick array ticks count:",
    lowerTickArray.data.ticks.length
  );
  console.log(
    "  - Upper tick array ticks count:",
    upperTickArray.data.ticks.length
  );

  console.log("Step 9: Calculating tick indices in arrays...");
  const lowerTickIndexInArray = getTickIndexInArray(
    position.data.tickLowerIndex,
    lowerTickArrayStartIndex,
    whirlpool.data.tickSpacing
  );
  const upperTickIndexInArray = getTickIndexInArray(
    position.data.tickUpperIndex,
    upperTickArrayStartIndex,
    whirlpool.data.tickSpacing
  );
  console.log("✓ Lower tick index in array:", lowerTickIndexInArray);
  console.log("✓ Upper tick index in array:", upperTickIndexInArray);

  const lowerTick = lowerTickArray.data.ticks[lowerTickIndexInArray];
  const upperTick = upperTickArray.data.ticks[upperTickIndexInArray];
  console.log("✓ Lower tick data retrieved");
  console.log("✓ Upper tick data retrieved");

  // Get trade fee
  console.log("Step 10: Calculating fees quote...");
  const feesQuote = collectFeesQuote(
    whirlpool.data,
    position.data,
    lowerTick,
    upperTick
  );
  console.log("✓ Fees quote calculated");
  console.log("Fees owed token A:", feesQuote.feeOwedA);
  console.log("Fees owed token B:", feesQuote.feeOwedB);

  // Get rewards
  console.log("Step 11: Calculating rewards quote...");
  const currentUnixTimestamp = BigInt(Math.floor(Date.now() / 1000));
  console.log("✓ Current timestamp:", currentUnixTimestamp);

  const rewardsQuote = collectRewardsQuote(
    whirlpool.data,
    position.data,
    lowerTick,
    upperTick,
    currentUnixTimestamp
  );
  console.log("✓ Rewards quote calculated");
  console.log("Rewards owed:");
  for (let i = 0; i < rewardsQuote.rewards.length; i++) {
    console.log(`  Token ${i + 1}: ${rewardsQuote.rewards[i].rewardsOwed}`);
  }

  console.log("=== Analysis Complete ===");
}
