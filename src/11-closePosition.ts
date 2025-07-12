import {
  closePosition,
  setPayerFromBytes,
  setRpc,
  setWhirlpoolsConfig,
} from "@orca-so/whirlpools";
import {
  address,
  createSolanaRpc,
  createKeyPairSignerFromBytes,
} from "@solana/kit";
import fs from "fs";

export async function closePositionFn() {
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
  console.log("wallet address:", signer.address);

  // Use the position mint from the previous output
  const positionMint = address("C4njzavvb4VW5gNXt9kd7TPhUXPuYXtMVmo8KCRn99Xj");

  // Set acceptable slippage
  const slippage = 100; // 100bps = 1%

  const {
    feesQuote,
    rewardsQuote,
    callback: sendTx,
  } = await closePosition(positionMint, slippage);

  // Send the transaction
  const signature = await sendTx();

  console.log("signature", signature);
  console.log("Fees owed token A:", feesQuote.feeOwedA);
  console.log("Fees owed token B:", feesQuote.feeOwedB);
  console.log("Rewards owed:");
  console.log(`  Token 1: ${rewardsQuote.rewards[0]?.rewardsOwed || 0}`);
  console.log(`  Token 2: ${rewardsQuote.rewards[1]?.rewardsOwed || 0}`);
  console.log(`  Token 3: ${rewardsQuote.rewards[2]?.rewardsOwed || 0}`);
  console.log("TX signature", signature);
}

// wallet address: BGx1XuPKQ4vVTViN7ShUV7YizQPpsovPomsN41BB4h6t
// Jito tip is not supported on this chain. Skipping jito tip.
// Jito tip is not supported on this chain. Skipping jito tip.
// signature 47DuHFi6EaEyXN1S55x5sA2eq9NhMkQETUFJtnBE1ErcrFrBwxU746PqMxkCDhRGzFGzwK1k1MUyP9P844RzUcJs
// Fees owed token A: 0n
// Fees owed token B: 0n
// Rewards owed:
//   Token 1: 0
//   Token 2: 0
//   Token 3: 0
// TX signature 47DuHFi6EaEyXN1S55x5sA2eq9NhMkQETUFJtnBE1ErcrFrBwxU746PqMxkCDhRGzFGzwK1k1MUyP9P844RzUcJs
