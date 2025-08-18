// CCTP V2 supported networks and contract addresses
export const CCTP_V2_NETWORKS = {
  ethereum: {
    chainId: 11155111,
    name: "Ethereum Sepolia",
    rpcUrl: process.env.INFURA_ETHEREUM_SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com",
    tokenMessengerV2: "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5",
    messageTransmitterV2: "0x7865fAfC2db2093669d92c0F33AeEF291086BEFD",
    tokenMinterV2: "0xb43db544E2c27092c107639Ad201b3dEfAbcF192",
    usdcAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    domain: 0,
    explorer: "https://sepolia.etherscan.io",
    nativeSymbol: "ETH",
    fastTransferEnabled: false,
    hooksEnabled: false,
    fastTransferAllowance: "0", // Disabled for V1
  },
  base: {
    chainId: 84532,
    name: "Base Sepolia",
    rpcUrl: process.env.INFURA_BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
    tokenMessengerV2: "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5",
    messageTransmitterV2: "0x7865fAfC2db2093669d92c0F33AeEF291086BEFD",
    tokenMinterV2: "0xb43db544E2c27092c107639Ad201b3dEfAbcF192",
    usdcAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    domain: 6,
    explorer: "https://sepolia-explorer.base.org",
    nativeSymbol: "ETH",
    fastTransferEnabled: false,
    hooksEnabled: false,
    fastTransferAllowance: "0",
  },
  arbitrum: {
    chainId: 421614,
    name: "Arbitrum Sepolia",
    rpcUrl: process.env.INFURA_ARBITRUM_SEPOLIA_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc",
    tokenMessengerV2: "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5",
    messageTransmitterV2: "0x7865fAfC2db2093669d92c0F33AeEF291086BEFD",
    tokenMinterV2: "0xb43db544E2c27092c107639Ad201b3dEfAbcF192",
    usdcAddress: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
    domain: 3,
    explorer: "https://sepolia-explorer.arbitrum.io",
    nativeSymbol: "ETH",
    fastTransferEnabled: false,
    hooksEnabled: false,
    fastTransferAllowance: "0",
  },
  polygon: {
    chainId: 80002,
    name: "Polygon Amoy",
    rpcUrl: process.env.INFURA_POLYGON_AMOY_RPC_URL || "https://rpc-amoy.polygon.technology",
    tokenMessengerV2: "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5",
    messageTransmitterV2: "0x7865fAfC2db2093669d92c0F33AeEF291086BEFD",
    tokenMinterV2: "0xb43db544E2c27092c107639Ad201b3dEfAbcF192",
    usdcAddress: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582",
    domain: 7,
    explorer: "https://amoy.polygonscan.com",
    nativeSymbol: "MATIC",
    fastTransferEnabled: false,
    hooksEnabled: false,
    fastTransferAllowance: "0",
  },
} as const

export type CCTPV2Network = keyof typeof CCTP_V2_NETWORKS
export type NetworkV2Config = (typeof CCTP_V2_NETWORKS)[CCTPV2Network]

export interface FastTransferConfig {
  enabled: boolean
  maxAmount: string
  estimatedTime: number // seconds
}

export interface HookConfig {
  enabled: boolean
  supportedHooks: string[]
  gasLimit: number
}

export interface TransferOptions {
  useFastTransfer?: boolean
  hookData?: {
    target: string
    callData: string
    gasLimit: number
  }
  slippageTolerance?: number
}

export const SUPPORTED_CHAINS_V2 = Object.values(CCTP_V2_NETWORKS).map((network) => ({
  id: network.chainId,
  name: network.name,
  network: Object.keys(CCTP_V2_NETWORKS).find(
    (key) => CCTP_V2_NETWORKS[key as CCTPV2Network].chainId === network.chainId,
  ) as CCTPV2Network,
  nativeCurrency: {
    decimals: 18,
    name: network.nativeSymbol === "MATIC" ? "Polygon" : "Ether",
    symbol: network.nativeSymbol,
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
  fastTransfer: {
    enabled: network.fastTransferEnabled,
    maxAmount: network.fastTransferAllowance,
    estimatedTime: network.fastTransferEnabled ? 30 : 900, // 15 minutes for V1
  } as FastTransferConfig,
  hooks: {
    enabled: network.hooksEnabled,
    supportedHooks: network.hooksEnabled ? ["mint-and-call", "mint-and-swap"] : [],
    gasLimit: 500000,
  } as HookConfig,
}))

export function getNetworkByChainIdV2(chainId: number): NetworkV2Config | undefined {
  return Object.values(CCTP_V2_NETWORKS).find((network) => network.chainId === chainId)
}

export function getNetworkByNameV2(name: CCTPV2Network): NetworkV2Config {
  return CCTP_V2_NETWORKS[name]
}

export function isFastTransferSupported(fromChain: number, toChain: number, amount: string): boolean {
  const fromNetwork = getNetworkByChainIdV2(fromChain)
  const toNetwork = getNetworkByChainIdV2(toChain)

  if (!fromNetwork?.fastTransferEnabled || !toNetwork?.fastTransferEnabled) {
    return false
  }

  const amountBigInt = BigInt(amount)
  const maxAmountBigInt = BigInt(fromNetwork.fastTransferAllowance)

  return amountBigInt <= maxAmountBigInt
}

export const CCTP_V2_CONFIG = {
  chains: CCTP_V2_NETWORKS,
  supportedChains: SUPPORTED_CHAINS_V2,
  getNetworkByChainId: getNetworkByChainIdV2,
  getNetworkByName: getNetworkByNameV2,
  isFastTransferSupported,
  // V2 API endpoints
  apiEndpoints: {
    attestation: 'https://iris-api-sandbox.circle.com/v2/messages/{sourceDomainId}',
    fastTransferAllowance: 'https://iris-api-sandbox.circle.com/v2/fastBurn/USDC/allowance',
  },
} as const

export const CCTP_NETWORKS = CCTP_V2_NETWORKS
export type CCTPNetwork = CCTPV2Network
export type NetworkConfig = NetworkV2Config
export const SUPPORTED_CHAINS = SUPPORTED_CHAINS_V2
export const getNetworkByChainId = getNetworkByChainIdV2
export const getNetworkByName = getNetworkByNameV2
export const CCTP_CONFIG = CCTP_V2_CONFIG
