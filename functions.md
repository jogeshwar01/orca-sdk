## SDK Function Reference

#### RPC and Key Management

- `createSolanaRpc`
- `createKeyPairSignerFromBytes`
- `Rpc.getBalance`

#### Configuration

- `setWhirlpoolsConfig`
- `setDefaultFunder`
- `setPayerFromBytes`
- `setComputeUnitMarginMultiplier`

#### Transaction Utilities

- `getTransferSolInstruction`
- `buildAndSendTransaction`

#### Token Management

- `rpc.getTokenAccountsByOwner`
- `fetchToken`

#### Account Information

- `rpc.getAccountInfo`
- `findAssociatedTokenPda`
- `getTransferCheckedInstruction`
- `getCreateAssociatedTokenInstruction`
- `getCreateAccountInstruction`
- `getInitializeMint2Instruction`
- `getMintToInstruction`

#### Whirlpool Operations

- `getWhirlpoolAddress`
- `swap`
- `fetchPositionsForOwner`
- `fetchWhirlpool`
- `sqrtPriceToPrice`
- `fetchSplashPool`
- `fetchConcentratedLiquidityPool`
- `fetchWhirlpoolsByTokenPair`
- `priceToTickIndex`
- `fetchPosition`
- `createSplashPool`
