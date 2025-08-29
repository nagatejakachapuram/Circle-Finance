import { type Address, encodeFunctionData, parseUnits, formatUnits } from "viem"
import type { Hex } from "viem"

export interface HookConfig {
  target: Address
  callData: string
  gasLimit: number
  description: string
}

export interface SwapParams {
  tokenIn: Address
  tokenOut: Address
  amountIn: string
  amountOutMin: string
  recipient: Address
  deadline?: number
}

export interface CallParams {
  target: Address
  functionName: string
  args: any[]
  value?: bigint
}

// Common DEX router addresses (testnet)
export const DEX_ROUTERS = {
  uniswapV3: {
    ethereum: "0xE592427A0AEce92De3Edee1F18E0157C05861564" as Address,
    base: "0x2626664c2603336E57B271c5C0b26F421741e481" as Address,
    arbitrum: "0xE592427A0AEce92De3Edee1F18E0157C05861564" as Address,
    polygon: "0xE592427A0AEce92De3Edee1F18E0157C05861564" as Address,
  },
  pancakeSwap: {
    base: "0x678Aa4bF4E210cf2166753e054d5b7c31cc7fa86" as Address,
  },
} as const

// Uniswap V3 Router ABI (minimal)
const UNISWAP_V3_ROUTER_ABI = [
  {
    inputs: [
      {
        components: [
          { name: "tokenIn", type: "address" },
          { name: "tokenOut", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "recipient", type: "address" },
          { name: "deadline", type: "uint256" },
          { name: "amountIn", type: "uint256" },
          { name: "amountOutMinimum", type: "uint256" },
          { name: "sqrtPriceLimitX96", type: "uint160" },
        ],
        name: "params",
        type: "tuple",
      },
    ],
    name: "exactInputSingle",
    outputs: [{ name: "amountOut", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
] as const

// Generic contract call ABI
const GENERIC_CALL_ABI = [
  {
    inputs: [
      { name: "target", type: "address" },
      { name: "data", type: "bytes" },
    ],
    name: "call",
    outputs: [
      { name: "success", type: "bool" },
      { name: "returnData", type: "bytes" },
    ],
    stateMutability: "payable",
    type: "function",
  },
] as const

export class CCTPHooks {
  /**
   * Create a hook for swapping USDC to another token after minting
   */
  static createSwapHook(
    chainId: number,
    swapParams: SwapParams,
    dexProtocol: "uniswapV3" | "pancakeSwap" = "uniswapV3",
  ): HookConfig {
    const deadline = swapParams.deadline || Math.floor(Date.now() / 1000) + 1800 // 30 minutes

    let routerAddress: Address
    let callData: string

    switch (dexProtocol) {
      case "uniswapV3":
        routerAddress = this.getUniswapRouter(chainId)
        callData = encodeFunctionData({
          abi: UNISWAP_V3_ROUTER_ABI,
          functionName: "exactInputSingle",
          args: [
            {
              tokenIn: swapParams.tokenIn,
              tokenOut: swapParams.tokenOut,
              fee: 3000, // 0.3% fee tier
              recipient: swapParams.recipient,
              deadline: BigInt(deadline),
              amountIn: parseUnits(swapParams.amountIn, 6), // USDC has 6 decimals
              amountOutMinimum: parseUnits(swapParams.amountOutMin, 18), // Most tokens have 18 decimals
              sqrtPriceLimitX96: BigInt(0),
            },
          ],
        })
        break

      case "pancakeSwap":
        routerAddress = this.getPancakeSwapRouter(chainId)
        // PancakeSwap implementation would go here
        throw new Error("PancakeSwap hooks not yet implemented")

      default:
        throw new Error(`Unsupported DEX protocol: ${dexProtocol}`)
    }

    return {
      target: routerAddress,
      callData,
      gasLimit: 300000, // Higher gas limit for DEX operations
      description: `Swap ${swapParams.amountIn} USDC to ${swapParams.tokenOut} via ${dexProtocol}`,
    }
  }

  /**
   * Create a hook for calling a custom contract function after minting
   */
  static createCallHook(callParams: CallParams): HookConfig {
    const callData = encodeFunctionData({
      abi: [
        {
          name: callParams.functionName,
          type: "function",
          inputs: [] as const, // This would need to be dynamic based on the actual function
          outputs: [],
          stateMutability: callParams.value ? "payable" : "nonpayable",
        },
      ],
      functionName: callParams.functionName,
      args: callParams.args as any,
    })

    return {
      target: callParams.target,
      callData,
      gasLimit: 200000,
      description: `Call ${callParams.functionName} on ${callParams.target}`,
    }
  }

  /**
   * Create a hook for staking USDC in a yield protocol after minting
   */
  static createStakeHook(stakingContract: Address, amount: string, recipient: Address): HookConfig {
    const callData = encodeFunctionData({
      abi: [
        {
          name: "stake",
          type: "function",
          inputs: [
            { name: "amount", type: "uint256" },
            { name: "recipient", type: "address" },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
      ],
      functionName: "stake",
      args: [parseUnits(amount, 6), recipient],
    })

    return {
      target: stakingContract,
      callData,
      gasLimit: 250000,
      description: `Stake ${amount} USDC in yield protocol`,
    }
  }

  /**
   * Create a hook for lending USDC to a lending protocol after minting
   */
  static createLendHook(lendingContract: Address, amount: string, recipient: Address): HookConfig {
    const callData = encodeFunctionData({
      abi: [
        {
          name: "supply",
          type: "function",
          inputs: [
            { name: "asset", type: "address" },
            { name: "amount", type: "uint256" },
            { name: "onBehalfOf", type: "address" },
            { name: "referralCode", type: "uint16" },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
      ],
      functionName: "supply",
      args: [
        "0x0000000000000000000000000000000000000000", // USDC address would be filled dynamically
        parseUnits(amount, 6),
        recipient,
        0, // No referral code
      ],
    })

    return {
      target: lendingContract,
      callData,
      gasLimit: 300000,
      description: `Lend ${amount} USDC to lending protocol`,
    }
  }

  /**
   * Create a hook for bridging USDC to another chain after minting
   */
  static createBridgeHook(
    bridgeContract: Address,
    destinationChainId: number,
    amount: string,
    recipient: Address,
  ): HookConfig {
    const callData = encodeFunctionData({
      abi: [
        {
          name: "bridge",
          type: "function",
          inputs: [
            { name: "token", type: "address" },
            { name: "amount", type: "uint256" },
            { name: "destinationChainId", type: "uint256" },
            { name: "recipient", type: "address" },
          ],
          outputs: [],
          stateMutability: "payable",
        },
      ],
      functionName: "bridge",
      args: [
        "0x0000000000000000000000000000000000000000", // USDC address
        parseUnits(amount, 6),
        BigInt(destinationChainId),
        recipient,
      ],
    })

    return {
      target: bridgeContract,
      callData,
      gasLimit: 400000, // Higher gas for bridge operations
      description: `Bridge ${amount} USDC to chain ${destinationChainId}`,
    }
  }

  /**
   * Combine multiple hooks into a single multicall hook
   */
  static createMulticallHook(hooks: HookConfig[]): HookConfig {
    const targets = hooks.map((h) => h.target as Address)
    const calldatas = hooks.map((h) => h.callData as Hex)

    const multicallData = encodeFunctionData({
      abi: [
        {
          name: "multicall",
          type: "function",
          inputs: [
            { name: "targets", type: "address[]" },
            { name: "calldatas", type: "bytes[]" },
          ],
          outputs: [{ name: "results", type: "bytes[]" }],
          stateMutability: "nonpayable",
        },
      ],
      functionName: "multicall",
      args: [targets, calldatas],
    })

    const totalGasLimit = hooks.reduce((sum, hook) => sum + hook.gasLimit, 0)
    const descriptions = hooks.map((h) => h.description).join(", ")

    return {
      target: "0x0000000000000000000000000000000000000000" as Address, // Multicall contract address
      callData: multicallData,
      gasLimit: totalGasLimit + 50000, // Add buffer for multicall overhead
      description: `Multicall: ${descriptions}`,
    }
  }

  /**
   * Validate hook configuration
   */
  static validateHook(hook: HookConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!hook.target || hook.target === "0x0000000000000000000000000000000000000000") {
      errors.push("Invalid target address")
    }

    if (!hook.callData || hook.callData.length < 10) {
      errors.push("Invalid call data")
    }

    if (hook.gasLimit < 21000) {
      errors.push("Gas limit too low")
    }

    if (hook.gasLimit > 1000000) {
      errors.push("Gas limit too high (max 1M)")
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Estimate gas cost for hook execution
   */
  static estimateHookCost(
    hook: HookConfig,
    gasPrice: bigint,
  ): {
    gasCost: bigint
    gasCostETH: string
  } {
    const gasCost = BigInt(hook.gasLimit) * gasPrice

    return {
      gasCost,
      gasCostETH: formatUnits(gasCost, 18),
    }
  }

  private static getUniswapRouter(chainId: number): Address {
    switch (chainId) {
      case 11155111: // Ethereum Sepolia
        return DEX_ROUTERS.uniswapV3.ethereum
      case 84532: // Base Sepolia
        return DEX_ROUTERS.uniswapV3.base
      case 421614: // Arbitrum Sepolia
        return DEX_ROUTERS.uniswapV3.arbitrum
      case 80002: // Polygon Amoy
        return DEX_ROUTERS.uniswapV3.polygon
      default:
        throw new Error(`Uniswap V3 not supported on chain ${chainId}`)
    }
  }

  private static getPancakeSwapRouter(chainId: number): Address {
    switch (chainId) {
      case 84532: // Base Sepolia
        return DEX_ROUTERS.pancakeSwap.base
      default:
        throw new Error(`PancakeSwap not supported on chain ${chainId}`)
    }
  }
}

// Hook presets for common operations
export const HOOK_PRESETS = {
  // Swap USDC to ETH after minting
  swapToETH: (chainId: number, amount: string, recipient: Address, minAmountOut = "0") =>
    CCTPHooks.createSwapHook(chainId, {
      tokenIn: "0x0000000000000000000000000000000000000000" as Address, // USDC address (dynamic)
      tokenOut: "0x0000000000000000000000000000000000000000" as Address, // WETH address (dynamic)
      amountIn: amount,
      amountOutMin: minAmountOut,
      recipient,
    }),

  // Swap USDC to WBTC after minting
  swapToWBTC: (chainId: number, amount: string, recipient: Address, minAmountOut = "0") =>
    CCTPHooks.createSwapHook(chainId, {
      tokenIn: "0x0000000000000000000000000000000000000000" as Address, // USDC address (dynamic)
      tokenOut: "0x0000000000000000000000000000000000000000" as Address, // WBTC address (dynamic)
      amountIn: amount,
      amountOutMin: minAmountOut,
      recipient,
    }),

  // Stake in Aave after minting
  stakeInAave: (amount: string, recipient: Address) =>
    CCTPHooks.createLendHook(
      "0x0000000000000000000000000000000000000000" as Address, // Aave Pool address (dynamic)
      amount,
      recipient,
    ),

  // Stake in Compound after minting
  stakeInCompound: (amount: string, recipient: Address) =>
    CCTPHooks.createStakeHook(
      "0x0000000000000000000000000000000000000000" as Address, // Compound cUSDC address (dynamic)
      amount,
      recipient,
    ),
} as const

export type HookPreset = keyof typeof HOOK_PRESETS
