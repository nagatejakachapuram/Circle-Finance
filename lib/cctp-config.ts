// CCTP supported networks and contract addresses
export const CCTP_NETWORKS = {
  ethereum: {
    chainId: 11155111,
    name: "Ethereum Sepolia",
    rpcUrl: process.env.INFURA_ETHEREUM_SEPOLIA_RPC_URL || "https://eth-sepolia.g.alchemy.com/v2/your-api-key",
    tokenMessenger: "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5",
    messageTransmitter: "0x7865fAfC2db2093669d92c0F33AeEF291086BEFD",
    usdcAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    domain: 0,
    explorer: "https://sepolia.etherscan.io",
  },
  base: {
    chainId: 84532,
    name: "Base Sepolia",
    rpcUrl: process.env.INFURA_BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
    tokenMessenger: "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5",
    messageTransmitter: "0x7865fAfC2db2093669d92c0F33AeEF291086BEFD",
    usdcAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    domain: 6,
    explorer: "https://sepolia-explorer.base.org",
  },
  arbitrum: {
    chainId: 421614,
    name: "Arbitrum Sepolia",
    rpcUrl: process.env.INFURA_ARBITRUM_SEPOLIA_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc",
    tokenMessenger: "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5",
    messageTransmitter: "0x7865fAfC2db2093669d92c0F33AeEF291086BEFD",
    usdcAddress: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
    domain: 3,
    explorer: "https://sepolia-explorer.arbitrum.io",
  },
  polygon: {
    chainId: 80002,
    name: "Polygon Amoy",
    rpcUrl: process.env.INFURA_POLYGON_AMOY_RPC_URL || "https://rpc-amoy.polygon.technology",
    tokenMessenger: "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5",
    messageTransmitter: "0x7865fAfC2db2093669d92c0F33AeEF291086BEFD",
    usdcAddress: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582",
    domain: 7,
    explorer: "https://amoy.polygonscan.com",
  },
} as const

export type CCTPNetwork = keyof typeof CCTP_NETWORKS
export type NetworkConfig = (typeof CCTP_NETWORKS)[CCTPNetwork]

export const SUPPORTED_CHAINS = Object.values(CCTP_NETWORKS).map((network) => ({
  id: network.chainId,
  name: network.name,
  network: Object.keys(CCTP_NETWORKS).find(
    (key) => CCTP_NETWORKS[key as CCTPNetwork].chainId === network.chainId,
  ) as CCTPNetwork,
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: [network.rpcUrl],
    },
    public: {
      http: [network.rpcUrl],
    },
  },
  blockExplorers: {
    default: { name: "Explorer", url: network.explorer },
  },
}))

export function getNetworkByChainId(chainId: number): NetworkConfig | undefined {
  return Object.values(CCTP_NETWORKS).find((network) => network.chainId === chainId)
}

export function getNetworkByName(name: CCTPNetwork): NetworkConfig {
  return CCTP_NETWORKS[name]
}

export const CCTP_CONFIG = {
  chains: CCTP_NETWORKS,
  supportedChains: SUPPORTED_CHAINS,
  getNetworkByChainId,
  getNetworkByName,
} as const
