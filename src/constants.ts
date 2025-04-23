export const MAINET_RPC_URL = 'https://eth-mainnet.g.alchemy.com/v2/';
export const POLYGON_RPC_URL = 'https://polygon-mainnet.g.alchemy.com/v2/';
export const OPTIMISM_RPC_URL = 'https://opt-mainnet.g.alchemy.com/v2/';
export const ARBITRUM_RPC_URL = 'https://arb-mainnet.g.alchemy.com/v2/';
export const BASE_RPC_URL = 'https://base-mainnet.g.alchemy.com/v2/';


export const ETH_MAIN = '0x0000000000000000000000000000000000000000';
export const USDT_ETH_DECIMALS = 18;
export const USDT_USD_DECIMALS = 8;
export const POL_MAIN_DECIMALS = 18;
export const USDT_DECIMALS = 6;
export const USDCE_DECIMALS = 6;
export const DAI_USD_DECIMALS = 8;
export const DAI_ETH_DECIMALS = 18;
export const ETH_USD_DECIMALS = 8;
export const MATIC_USD_DECIMALS = 8;
export const MATIC_ETH_DECIMALS = 18;
export const USDC_USD_DECIMALS = 8;
export const USDC_ETH_DECIMALS = 18;
export const USDT_USD_DECIMALS_NEW = 8; // Ensure no naming conflicts
export const USDT_ETH_DECIMALS_NEW = 18; // Ensure no naming conflicts
export const WBTC_USD_DECIMALS = 8;
export const WBTC_ETH_DECIMALS = 18;
export const MATIC_DECIMALS = 18;
export const WBTC_DECIMALS = 8;
export const WETH_DECIMALS = 18;
export const LINK_DECIMALS = 18;
export const AAVE_DECIMALS = 18;
export const GNS_DECIMALS = 18;


// POLYGON ADDRESSES
export const POL_ORACLE_ADDRESS = '0x8DeF6ed1f27A02b26024C78aDcE2957d23DFD672';
export const POL_MAIN = "0x0000000000000000000000000000000000000000";
export const POL_USDT = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';
export const POL_DAI = '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063';
export const POL_WMATIC = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270';
export const POL_USDCE = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
export const POL_WBTC = '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6';
export const POL_WETH = '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619';
export const POL_LINK = '0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39';
export const POL_AAVE = '0xD6DF932A45C0f255f85145f286eA0b292B21C90B';
export const POL_GNS = '0xE5417Af564e4bFDA1c483642db72007871397896';
export const POL_USDC='0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359';

/**
 * Checks if the provided address is a supported Polygon token
 * @param address The token address to check
 * @returns true if the address matches a supported Polygon token, false otherwise
 */
export function isPolygonSupportedToken(address: string): boolean {
  // Convert to lowercase for case-insensitive comparison
  const normalizedAddress = address.toLowerCase();
  
  // List of supported Polygon token addresses
  const supportedTokens = [
    POL_MAIN.toLowerCase(),
    POL_USDT.toLowerCase(),
    POL_DAI.toLowerCase(),
    POL_WMATIC.toLowerCase(),
    POL_USDCE.toLowerCase(),
    POL_WBTC.toLowerCase(),
    POL_WETH.toLowerCase(),
    POL_LINK.toLowerCase(),
    POL_AAVE.toLowerCase(),
    POL_GNS.toLowerCase(),
    POL_USDC.toLowerCase()
  ];
  
  return supportedTokens.includes(normalizedAddress);
}