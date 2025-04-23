import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { ChainManager } from './pol-manager';
import { polygon } from 'viem/chains';
import { POLYGON_RPC_URL } from './constants';

// Load .env.local file from the src directory (where it's actually located)
dotenv.config({ path: resolve(process.cwd(), 'src/.env.local') });

console.log("Hello, TypeScript!");

async function main() {
    // Example usage of the ChainManager class
    const chainManager = new ChainManager(polygon, POLYGON_RPC_URL + process.env.ALCHEMY_API_KEY, true);
    const result = await chainManager.withdrawDiversifier("0x27DbE8809657EF8e0299eDF2D4876E83e0D72c1F");
    console.log("Withdraw Diversifier Result:", result);
}

main();
