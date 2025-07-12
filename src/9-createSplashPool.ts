import {
  Account,
  Address,
  createKeyPairSignerFromBytes,
  createSolanaRpc,
  generateKeyPairSigner,
  getAddressEncoder,
  KeyPairSigner,
  Rpc,
  SolanaRpcApi,
} from "@solana/kit";
import {
  fetchMint,
  getCreateAssociatedTokenInstruction,
  getInitializeMint2Instruction,
  getMintToInstruction,
  Mint,
  TOKEN_PROGRAM_ADDRESS,
  findAssociatedTokenPda,
} from "@solana-program/token";
import {
  createSplashPool,
  setWhirlpoolsConfig,
  setRpc as setRpcActions,
  setPayerFromBytes,
} from "@orca-so/whirlpools";
import { fetchWhirlpool } from "@orca-so/whirlpools-client";
import { sqrtPriceToPrice } from "@orca-so/whirlpools-core";
import { getCreateAccountInstruction } from "@solana-program/system";
import { buildAndSendTransaction, setRpc } from "@orca-so/tx-sender";
import fs from "fs";

// What is a SplashPool?
// SplashPools are built on top of Orca's CLMM, but behave similar to a Constant Product AMM.
// - it is a Whirlpool with a specific tick_spacing. SplashPool can be handled as Whirlpool.
// - it has only 2 TickArrays (simple, low cost), which are initialized in the createSplashPool function.
// - it allows FullRange positions only (similar to Constant Product AMM)
export async function createSplashPoolFn() {
  // Initialize a connection to the RPC and read in private key
  const rpc = createSolanaRpc("https://api.devnet.solana.com");
  await setRpc("https://api.devnet.solana.com");
  await setRpcActions("https://api.devnet.solana.com");
  const keyPairBytes = new Uint8Array(
    JSON.parse(
      fs.readFileSync("/home/jogeshwar/.config/solana/id.json", "utf-8")
    )
  );

  const wallet = await createKeyPairSignerFromBytes(keyPairBytes);
  const signer = await setPayerFromBytes(keyPairBytes);

  await setPayerFromBytes(keyPairBytes);
  await setWhirlpoolsConfig("solanaDevnet");
  console.log("wallet address:", signer.address);

  // Create new token mints. Note that the in a more realistic scenario,
  // the mints are generated beforehand.
  const newTokenPubkeys = await Promise.all([
    createNewTokenMint(rpc, signer, signer.address, signer.address, 9),
    createNewTokenMint(rpc, signer, signer.address, signer.address, 6),
  ]);

  // Token A and Token B Mint has to be cardinally ordered
  // For example, SOL/USDC can be created, but USDC/SOL cannot be created
  const [tokenAddressA, tokenAddressB] = orderMints(
    newTokenPubkeys[0],
    newTokenPubkeys[1]
  );

  // Fetch token mint infos
  const tokenA: Account<Mint, Address> = await fetchMint(rpc, tokenAddressA);
  const tokenB: Account<Mint, Address> = await fetchMint(rpc, tokenAddressB);

  const decimalA = tokenA.data.decimals;
  const decimalB = tokenB.data.decimals;
  console.log("tokenA:", tokenAddressA, "decimalA:", decimalA);
  console.log("tokenB:", tokenAddressB, "decimalB:", decimalB);

  await Promise.all([
    mintTokensToAccount(rpc, signer, newTokenPubkeys[0], signer.address),
    mintTokensToAccount(rpc, signer, newTokenPubkeys[1], signer.address),
  ]);

  // Set the price of token A in terms of token B
  const initialPrice = 0.01;

  // Create a new pool
  const { poolAddress, callback: sendTx } = await createSplashPool(
    tokenAddressA,
    tokenAddressB,
    initialPrice
  );
  const signature = await sendTx();

  // Fetch pool data to verify the initial price and tick
  const pool = await fetchWhirlpool(rpc, poolAddress);
  const poolData = pool.data;
  const poolInitialPrice = sqrtPriceToPrice(
    poolData.sqrtPrice,
    decimalA,
    decimalB
  );
  const poolInitialTick = poolData.tickCurrentIndex;

  console.log("txId:", signature);
  console.log(
    "poolAddress:",
    poolAddress.toString(),
    "\n  tokenA:",
    poolData.tokenMintA.toString(),
    "\n  tokenB:",
    poolData.tokenMintB.toString(),
    "\n  tickSpacing:",
    poolData.tickSpacing,
    "\n  initialPrice:",
    poolInitialPrice,
    "\n  initialTick:",
    poolInitialTick
  );
}

async function createNewTokenMint(
  rpc: Rpc<SolanaRpcApi>,
  signer: KeyPairSigner,
  mintAuthority: Address,
  freezeAuthority: Address,
  decimals: number
) {
  const keypair = await generateKeyPairSigner();
  const mintLen = 82;
  const lamports = await rpc
    .getMinimumBalanceForRentExemption(BigInt(mintLen))
    .send();
  const createAccountInstruction = getCreateAccountInstruction({
    payer: signer,
    newAccount: keypair,
    lamports,
    space: mintLen,
    programAddress: TOKEN_PROGRAM_ADDRESS,
  });

  const initializeMintInstruction = getInitializeMint2Instruction({
    mint: keypair.address,
    decimals,
    mintAuthority,
    freezeAuthority,
  });

  await buildAndSendTransaction(
    [createAccountInstruction, initializeMintInstruction],
    signer
  );

  return keypair.address;
}

// This function is implemented in token.ts in the @orca/whirlpools package
function orderMints(mintA: Address, mintB: Address) {
  const encoder = getAddressEncoder();
  const mint1Bytes = new Uint8Array(encoder.encode(mintA));
  const mint2Bytes = new Uint8Array(encoder.encode(mintB));
  return Buffer.compare(mint1Bytes, mint2Bytes) < 0
    ? [mintA, mintB]
    : [mintB, mintA];
}

async function mintTokensToAccount(
  rpc: Rpc<SolanaRpcApi>,
  signer: KeyPairSigner,
  mint: Address,
  owner: Address
) {
  // Find the Associated Token Account (ATA) PDA
  const [tokenAccount] = await findAssociatedTokenPda({
    owner: owner,
    mint: mint,
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
  });

  console.log(`Token account for mint ${mint}: ${tokenAccount}`);

  // Check if the token account exists
  const accountInfo = await rpc
    .getAccountInfo(tokenAccount, { encoding: "base64" })
    .send();

  const instructions = [];

  // If the token account doesn't exist, create it
  if (!accountInfo.value) {
    console.log("Token account does not exist. Creating it first...");
    const createAtaInstruction = getCreateAssociatedTokenInstruction({
      payer: signer,
      owner: owner,
      mint: mint,
      ata: tokenAccount,
    });
    instructions.push(createAtaInstruction);
  } else {
    console.log("Token account exists. Proceeding with mint...");
  }

  // Create the mint instruction
  const mintToInstruction = getMintToInstruction({
    mint: mint,
    token: tokenAccount,
    mintAuthority: signer.address,
    amount: 10000,
  });
  instructions.push(mintToInstruction);

  // Send the transaction
  await buildAndSendTransaction(instructions, signer);

  console.log(`Minted 10000 tokens - Mint(${mint}) Token(${tokenAccount})`);
}

// import { createSetAuthorityInstruction, AuthorityType } from "@solana/spl-token";

// const revokeMintAuthorityIx = createSetAuthorityInstruction(
//   mintAddress, // The mint account
//   currentMintAuthority.publicKey, // Current authority
//   AuthorityType.MintTokens,
//   null // newAuthority is null to revoke
// );

// const tx = new Transaction().add(revokeMintAuthorityIx);
// await sendAndConfirmTransaction(connection, tx, [currentMintAuthority]);
