nvm use 22 (to prevent errors - SolanaError: cannot randomise.....)
npm i @typescript @types/node @solana/kit @orca-so/whirlpools

set "target": "es2022" - enable bigint ie. 100000n

to fix computational budget issue - double budget than estimated - setComputeUnitMarginMultiplier(2);
