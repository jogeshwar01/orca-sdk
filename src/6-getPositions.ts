import { createKeyPairSignerFromBytes, createSolanaRpc } from "@solana/kit";
import { fetchPositionsForOwner } from "@orca-so/whirlpools";
import fs from "fs";

export async function getPositions() {
  // Initialize a connection to the RPC
  const rpc = createSolanaRpc("https://api.mainnet-beta.solana.com");
  const signer = await createKeyPairSignerFromBytes(
    new Uint8Array(
      JSON.parse(
        fs.readFileSync("/home/jogeshwar/.config/solana/id.json", "utf-8")
      )
    )
  );
  console.log("wallet address:", signer.address);

  // Output the address of the positions
  const positions = await fetchPositionsForOwner(rpc, signer.address);
  console.log("positions:", positions);
}
