## SDK Function Reference

#### RPC and Key Management

- `createSolanaRpc`
- `createKeyPairSignerFromBytes`
- `Rpc.getBalance`

#### Configuration

- `setWhirlpoolsConfig`
- `setDefaultFunder`
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