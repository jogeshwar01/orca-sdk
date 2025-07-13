import {
  createConcentratedLiquidityPool,
  createSplashPool,
  fetchWhirlpoolsByTokenPair,
  setPayerFromBytes,
  setWhirlpoolsConfig,
  setRpc as setRpcActions,
} from "@orca-so/whirlpools";
import {
  Account,
  Address,
  address,
  createKeyPairSignerFromBytes,
  createSolanaRpc,
  generateKeyPairSigner,
  getAddressEncoder,
  KeyPairSigner,
  lamports,
  Rpc,
  SolanaRpcApiTestnet,
} from "@solana/kit";
import { buildAndSendTransaction, setRpc } from "@orca-so/tx-sender";
import {
  fetchToken,
  TOKEN_PROGRAM_ADDRESS,
  getTransferCheckedInstruction,
  findAssociatedTokenPda,
  getCreateAssociatedTokenInstruction,
  getMintSize,
  getInitializeMint2Instruction,
  getMintToInstruction,
  fetchMint,
  Mint,
} from "@solana-program/token";
import { getCreateAccountInstruction } from "@solana-program/system";
import { fetchWhirlpool } from "@orca-so/whirlpools-client";
import { sqrtPriceToPrice } from "@orca-so/whirlpools-core";

// import bs58 from "bs58";
import fs from "fs";

async function test() {
  const rpc = createSolanaRpc("https://api.devnet.solana.com");
  await setRpc("https://api.devnet.solana.com");
  await setRpcActions("https://api.devnet.solana.com");
  setWhirlpoolsConfig("solanaDevnet");

  const otherWallet = address("Htg9cXNdSrP37Q1ZJqsewMoMTdBfkrRHYYm3F1EJj5Uk");
  const mint = address("Hxhz44Az821XATE94sA22h6AKnDtBQcgLBkdQnoxYZJf");

  // const keyBytes = bs58.decode("3kkYVuL7WVGqNwjibjopTXFCbPH7Q1cq79vLvbFJMu3EPqVqByTE3aQCPweMUuuwKEcG3rKHLZ3XXp1KyAvnXQVA");
  // const uarr = new Uint8Array(keyBytes);
  const keyBytes = new Uint8Array(
    JSON.parse(
      fs.readFileSync("/home/jogeshwar/.config/solana/id.json", "utf-8")
    )
  );
  await setPayerFromBytes(keyBytes);

  const signer = await createKeyPairSignerFromBytes(keyBytes);

  const mint1 = await generateKeyPairSigner();
  const mint2 = await generateKeyPairSigner();

  const mintAddresses = await Promise.all([
    initialiseMintFn(rpc, mint1, signer),
    initialiseMintFn(rpc, mint2, signer),
  ]);

  const [tokenAddressA, tokenAddressB] = orderMints(
    mintAddresses[0],
    mintAddresses[1]
  );

  const tokenA: Account<Mint, Address> = await fetchMint(rpc, tokenAddressA);
  const tokenB: Account<Mint, Address> = await fetchMint(rpc, tokenAddressB);

  const decimalA = tokenA.data.decimals;
  const decimalB = tokenB.data.decimals;
  console.log("tokenA:", tokenAddressA, "decimalA:", decimalA);
  console.log("tokenB:", tokenAddressB, "decimalB:", decimalB);

  await Promise.all([
    mintTokensToAccount(rpc, tokenAddressA, signer),
    mintTokensToAccount(rpc, tokenAddressB, signer),
  ]);

  const { poolAddress, callback: sendTx } =
    await createConcentratedLiquidityPool(
      tokenAddressA,
      tokenAddressB,
      2,
      0.01
    );
  const signature = await sendTx();
  console.log("sig", signature);

  const pool = await fetchWhirlpool(rpc, poolAddress);
  const poolData = pool.data;
  const poolInitialPrice = sqrtPriceToPrice(poolData.sqrtPrice, 6, 6);
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

  const whirlpool = await fetchWhirlpoolsByTokenPair(
    rpc,
    tokenAddressA,
    tokenAddressB
  );
  console.log("whirlpool", whirlpool);
}

async function initialiseMintFn(
  rpc: Rpc<SolanaRpcApiTestnet>,
  mint: KeyPairSigner,
  signer: KeyPairSigner
) {
  const mintSize = BigInt(getMintSize());
  const i1 = getCreateAccountInstruction({
    payer: signer,
    newAccount: mint,
    lamports: await rpc.getMinimumBalanceForRentExemption(mintSize).send(),
    space: mintSize,
    programAddress: TOKEN_PROGRAM_ADDRESS,
  });

  const i2 = getInitializeMint2Instruction({
    mint: mint.address,
    decimals: 6,
    mintAuthority: signer.address,
    freezeAuthority: signer.address,
  });

  await buildAndSendTransaction([i1, i2], signer);

  return mint.address;
}

async function mintTokensToAccount(
  rpc: Rpc<SolanaRpcApiTestnet>,
  mint: Address,
  signer: KeyPairSigner
) {
  const [pda, Bump] = await findAssociatedTokenPda({
    owner: signer.address,
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
    mint: mint,
  });

  const acountInfo = await rpc
    .getAccountInfo(pda, {
      commitment: "finalized",
      encoding: "base64",
    })
    .send();
  console.log("acc info", acountInfo);

  const instructions = [];
  if (!acountInfo.value) {
    const createPdaInstn = getCreateAssociatedTokenInstruction({
      payer: signer,
      ata: pda,
      owner: signer.address,
      mint: mint,
    });
    instructions.push(createPdaInstn);
  }

  const mintToInstn = getMintToInstruction({
    mint: mint,
    token: pda,
    mintAuthority: signer.address,
    amount: 10000000000,
  });

  instructions.push(mintToInstn);
  await buildAndSendTransaction(instructions, signer);

  console.log(`Minted 10000000000 tokens - Mint(${mint}) Token(${pda})`);
}
function orderMints(mintA: Address, mintB: Address) {
  const encoder = getAddressEncoder();
  const mint1Bytes = new Uint8Array(encoder.encode(mintA));
  const mint2Bytes = new Uint8Array(encoder.encode(mintB));
  return Buffer.compare(mint1Bytes, mint2Bytes) < 0
    ? [mintA, mintB]
    : [mintB, mintA];
}

test();
