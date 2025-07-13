# Orca SDK

- nvm use 22 (to prevent errors - SolanaError: cannot randomise.....)

- npm i @typescript @types/node @solana/kit @orca-so/whirlpools

- set "target": "es2022" - enable bigint ie. 100000n

- to fix computational budget issue - double budget than estimated - `setComputeUnitMarginMultiplier(2);`

- Use private key

```const privateKeyBase58 = "<key_here>";
const privateKeyBytes = bs58.decode(privateKeyBase58);
const wallet = await createKeyPairSignerFromBytes(privateKeyBytes);
```

- Use token-2022 only for all token related stuff

- whirlpools dont support token-2022 - so use token to create mint and all if pools are to be created
