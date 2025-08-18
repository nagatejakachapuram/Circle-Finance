import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  parseUnits,
  formatUnits,
  type Hash,
  type Address,
  parseEventLogs,
  type TransactionReceipt,
  type Log,
} from "viem"
import { sepolia, baseSepolia, arbitrumSepolia, polygonAmoy } from "viem/chains"
import {
  CCTP_V2_NETWORKS,
  type CCTPV2Network,
  type NetworkV2Config,
  type TransferOptions,
  isFastTransferSupported,
} from "./cctp-config"
import {
  TOKEN_MESSENGER_ABI,
  MESSAGE_TRANSMITTER_ABI,
  ERC20_ABI,
  TOKEN_MESSENGER_EVENTS,
  parseDepositForBurnEvent,
} from "./cctp-contracts"

const getViemChain = (chainId: number) => {
  switch (chainId) {
    case 11155111:
      return sepolia
    case 84532:
      return baseSepolia
    case 421614:
      return arbitrumSepolia
    case 80002:
      return polygonAmoy
    default:
      throw new Error(`Unsupported chain ID: ${chainId}`)
  }
}

export interface CCTPV2Transfer {
  sourceChain: CCTPV2Network
  destinationChain: CCTPV2Network
  amount: string
  sourceAddress: Address
  destinationAddress: Address
  nonce?: bigint
  burnTxHash?: Hash
  mintTxHash?: Hash
  status: "pending" | "burned" | "attested" | "minted" | "failed"
  message?: string
  attestation?: string
  timestamp: number
  // V2 specific fields
  useFastTransfer?: boolean
  estimatedCompletionTime?: number // seconds
  hookData?: {
    target: string
    callData: string
    gasLimit: number
  }
}

export interface FastTransferStatus {
  available: boolean
  maxAmount: string
  estimatedTime: number
  reason?: string
}

export class CCTPV2Client {
  private sourceNetwork: NetworkV2Config
  private destinationNetwork: NetworkV2Config
  public sourcePublicClient: any
  private destinationPublicClient: any
  private walletClient: any

  constructor(sourceChain: CCTPV2Network, destinationChain: CCTPV2Network) {
    this.sourceNetwork = CCTP_V2_NETWORKS[sourceChain]
    this.destinationNetwork = CCTP_V2_NETWORKS[destinationChain]

    const sourceViemChain = getViemChain(this.sourceNetwork.chainId)
    const destinationViemChain = getViemChain(this.destinationNetwork.chainId)

    this.sourcePublicClient = createPublicClient({
      chain: sourceViemChain,
      transport: http(this.sourceNetwork.rpcUrl),
    })

    this.destinationPublicClient = createPublicClient({
      chain: destinationViemChain,
      transport: http(this.destinationNetwork.rpcUrl),
    })

    this.walletClient = createWalletClient({
      chain: sourceViemChain,
      transport: custom(window.ethereum),
    })
  }

  async checkFastTransferAvailability(amount: string): Promise<FastTransferStatus> {
    try {
      const isSupported = isFastTransferSupported(
        this.sourceNetwork.chainId,
        this.destinationNetwork.chainId,
        parseUnits(amount, 6).toString(),
      )

      if (!isSupported) {
        return {
          available: false,
          maxAmount: formatUnits(BigInt(this.sourceNetwork.fastTransferAllowance), 6),
          estimatedTime: 30,
          reason: `Amount exceeds Fast Transfer limit of ${formatUnits(BigInt(this.sourceNetwork.fastTransferAllowance), 6)} USDC`,
        }
      }

      // Check current Fast Transfer allowance via API
      try {
        const response = await fetch(
          `https://iris-api.circle.com/v2/fast-transfer-allowance?source_domain=${this.sourceNetwork.domain}&destination_domain=${this.destinationNetwork.domain}`,
        )

        if (response.ok) {
          const data = await response.json()
          const availableAmount = BigInt(data.available_amount || this.sourceNetwork.fastTransferAllowance)
          const requestedAmount = parseUnits(amount, 6)

          if (requestedAmount <= availableAmount) {
            return {
              available: true,
              maxAmount: formatUnits(availableAmount, 6),
              estimatedTime: 30,
            }
          } else {
            return {
              available: false,
              maxAmount: formatUnits(availableAmount, 6),
              estimatedTime: 30,
              reason: `Fast Transfer temporarily unavailable. Current limit: ${formatUnits(availableAmount, 6)} USDC`,
            }
          }
        }
      } catch (apiError) {
        console.log("[v0] Fast Transfer API check failed, using default limits:", apiError)
      }

      // Fallback to configured limits
      return {
        available: true,
        maxAmount: formatUnits(BigInt(this.sourceNetwork.fastTransferAllowance), 6),
        estimatedTime: 30,
      }
    } catch (error) {
      console.error("[v0] Fast Transfer availability check failed:", error)
      return {
        available: false,
        maxAmount: "0",
        estimatedTime: 900, // 15 minutes fallback
        reason: "Unable to check Fast Transfer availability",
      }
    }
  }

  async getUSDCBalance(userAddress: Address): Promise<string> {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        console.log(`[v0] Attempting balance check ${attempt + 1}/3 on ${this.sourceNetwork.name}`)
        const balance = await this.sourcePublicClient.readContract({
          address: this.sourceNetwork.usdcAddress as Address,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [userAddress],
        })

        const formattedBalance = formatUnits(balance, 6)
        console.log(`[v0] USDC balance check successful: ${formattedBalance} USDC`)
        return formattedBalance
      } catch (error) {
        console.log(`[v0] Balance check attempt ${attempt + 1} failed:`, error)
        if (attempt === 2) {
          console.log(`[v0] All balance check attempts failed, returning 0`)
          return "0"
        }
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }
    return "0"
  }

  async approveUSDC(userAddress: Address, amount: string): Promise<Hash> {
    try {
      const currentChainId = await this.walletClient.getChainId()
      if (currentChainId !== this.sourceNetwork.chainId) {
        throw new Error(`Please switch to ${this.sourceNetwork.name} network (Chain ID: ${this.sourceNetwork.chainId})`)
      }

      const amountWei = parseUnits(amount, 6)
      const spenderAddress = this.sourceNetwork.tokenMessengerV2 as Address

      try {
        const [usdcBalance, nativeBalance] = await Promise.all([
          this.getUSDCBalance(userAddress),
          this.sourcePublicClient.getBalance({ address: userAddress }),
        ])

        if (Number.parseFloat(usdcBalance) < Number.parseFloat(amount)) {
          throw new Error(
            `Insufficient USDC balance. You have ${usdcBalance} USDC but need ${amount} USDC on ${this.sourceNetwork.name}. Please get USDC from a faucet or bridge from another network.`,
          )
        }

        const minGasBalance = this.sourceNetwork.chainId === 80002 ? "0.01" : "0.001"
        if (nativeBalance < parseUnits(minGasBalance, 18)) {
          const nativeSymbol = this.sourceNetwork.nativeSymbol
          throw new Error(
            `Insufficient ${nativeSymbol} balance for gas fees. You need at least ${minGasBalance} ${nativeSymbol} on ${this.sourceNetwork.name}. Please get ${nativeSymbol} from a faucet.`,
          )
        }
      } catch (error) {
        if (
          error instanceof Error &&
          (error.message.includes("Insufficient") || error.message.includes("need at least"))
        ) {
          throw error
        }
        console.log(`[v0] Balance checks failed, proceeding with transaction:`, error)
      }

      // Check current allowance
      let currentAllowance = BigInt(0)
      try {
        currentAllowance = await this.sourcePublicClient.readContract({
          address: this.sourceNetwork.usdcAddress as Address,
          abi: ERC20_ABI,
          functionName: "allowance",
          args: [userAddress, spenderAddress],
        })

        if (currentAllowance >= amountWei) {
          console.log("[v0] Sufficient allowance already exists:", formatUnits(currentAllowance, 6))
          return "0x0000000000000000000000000000000000000000000000000000000000000000" as Hash
        }
      } catch (allowanceError) {
        console.log(`[v0] Allowance check failed, proceeding with approval:`, allowanceError)
      }

      if (currentAllowance > 0) {
        try {
          console.log("[v0] Resetting existing allowance to 0...")
          const resetHash = await this.walletClient.writeContract({
            address: this.sourceNetwork.usdcAddress as Address,
            abi: ERC20_ABI,
            functionName: "approve",
            args: [spenderAddress, BigInt(0)],
            account: userAddress,
          })

          await this.sourcePublicClient.waitForTransactionReceipt({ hash: resetHash })
          console.log("[v0] Allowance reset completed:", resetHash)
        } catch (resetError) {
          console.log("[v0] Allowance reset failed, proceeding with direct approval:", resetError)
        }
      }

      // Estimate gas with fallback
      let gasEstimate: bigint
      try {
        gasEstimate = await this.sourcePublicClient.estimateContractGas({
          address: this.sourceNetwork.usdcAddress as Address,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [spenderAddress, amountWei],
          account: userAddress,
        })
      } catch (gasError) {
        console.log("[v0] Gas estimation failed, using fallback:", gasError)
        gasEstimate = BigInt(60000)
      }

      console.log("[v0] Approving USDC spending:", {
        amount: formatUnits(amountWei, 6),
        spender: spenderAddress,
        gasEstimate: gasEstimate.toString(),
        network: this.sourceNetwork.name,
        chainId: currentChainId,
      })

      const hash = await this.walletClient.writeContract({
        address: this.sourceNetwork.usdcAddress as Address,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [spenderAddress, amountWei],
        account: userAddress,
        gas: gasEstimate + BigInt(20000), // Add buffer
      })

      console.log("[v0] USDC approval transaction submitted:", hash)
      return hash
    } catch (error) {
      console.error("[v0] USDC approval failed:", error)

      if (error instanceof Error) {
        if (error.message.includes("insufficient funds") || error.message.includes("Insufficient")) {
          throw error // Pass through our custom insufficient balance messages
        } else if (error.message.includes("user rejected") || error.message.includes("User rejected")) {
          throw new Error("Transaction was rejected by user")
        } else if (error.message.includes("Internal JSON-RPC error")) {
          throw new Error(
            `Network error on ${this.sourceNetwork.name}. This could be due to:\n• Network congestion - try again in a few minutes\n• RPC endpoint issues - try switching networks and back\n• Insufficient gas fees - ensure you have enough ${this.sourceNetwork.nativeSymbol}`,
          )
        } else if (error.message.includes("HTTP request failed") || error.message.includes("Failed to fetch")) {
          throw new Error(
            `Connection failed to ${this.sourceNetwork.name}. Please check your internet connection and try again.`,
          )
        } else if (error.message.includes("execution reverted")) {
          throw new Error(
            `Transaction rejected by ${this.sourceNetwork.name} network. This might be due to insufficient balance or network issues.`,
          )
        } else if (error.message.includes("Chain ID") || error.message.includes("switch to")) {
          throw error // Pass through network switching errors
        }
      }

      throw new Error(
        `Failed to approve USDC on ${this.sourceNetwork.name}: ${error instanceof Error ? error.message : "Unknown error"}`,
      )
    }
  }

  async burnUSDC(
    userAddress: Address,
    amount: string,
    destinationAddress: Address,
    options: TransferOptions = {},
  ): Promise<{ hash: Hash; nonce: bigint; transfer: CCTPV2Transfer }> {
    try {
      const amountWei = parseUnits(amount, 6)
      const mintRecipient = `0x${destinationAddress.slice(2).padStart(64, "0")}` as `0x${string}`

      // Check if Fast Transfer should be used
      let useFastTransfer = options.useFastTransfer || false
      let estimatedTime = 900 // 15 minutes default

      if (useFastTransfer) {
        const fastTransferStatus = await this.checkFastTransferAvailability(amount)
        if (fastTransferStatus.available) {
          estimatedTime = fastTransferStatus.estimatedTime
          console.log("[v0] Using Fast Transfer - estimated completion:", estimatedTime, "seconds")
        } else {
          console.log("[v0] Fast Transfer not available, falling back to standard transfer:", fastTransferStatus.reason)
          useFastTransfer = false
        }
      }

      const contractAddress = this.sourceNetwork.tokenMessengerV2 as Address

      let gasEstimate: bigint
      try {
        if (options.hookData) {
          // For hooks, we need to estimate gas for depositForBurnWithCaller
          gasEstimate = await this.sourcePublicClient.estimateContractGas({
            address: contractAddress,
            abi: TOKEN_MESSENGER_ABI,
            functionName: "depositForBurnWithCaller",
            args: [
              amountWei,
              this.destinationNetwork.domain,
              mintRecipient,
              this.sourceNetwork.usdcAddress as Address,
              options.hookData.target as Address,
            ],
            account: userAddress,
          })
        } else {
          gasEstimate = await this.sourcePublicClient.estimateContractGas({
            address: contractAddress,
            abi: TOKEN_MESSENGER_ABI,
            functionName: "depositForBurn",
            args: [amountWei, this.destinationNetwork.domain, mintRecipient, this.sourceNetwork.usdcAddress as Address],
            account: userAddress,
          })
        }
      } catch (gasError) {
        console.log("[v0] Gas estimation failed, using fallback:", gasError)
        gasEstimate = BigInt(options.hookData ? 300000 : 200000) // Higher gas for hooks
      }

      let hash: Hash
      let nonce = BigInt(0)

      if (options.hookData) {
        // Execute burn with hook
        const { request } = await this.sourcePublicClient.simulateContract({
          address: contractAddress,
          abi: TOKEN_MESSENGER_ABI,
          functionName: "depositForBurnWithCaller",
          args: [
            amountWei,
            this.destinationNetwork.domain,
            mintRecipient,
            this.sourceNetwork.usdcAddress as Address,
            options.hookData.target as Address,
          ],
          account: userAddress,
          gas: gasEstimate + BigInt(50000),
        })

        hash = await this.walletClient.writeContract(request)
      } else {
        // Standard burn
        const { request } = await this.sourcePublicClient.simulateContract({
          address: contractAddress,
          abi: TOKEN_MESSENGER_ABI,
          functionName: "depositForBurn",
          args: [amountWei, this.destinationNetwork.domain, mintRecipient, this.sourceNetwork.usdcAddress as Address],
          account: userAddress,
          gas: gasEstimate + BigInt(50000),
        })

        hash = await this.walletClient.writeContract(request)
      }

      // Wait for transaction receipt and parse events
      const receipt = await this.sourcePublicClient.waitForTransactionReceipt({ hash })
      const parsedLogs = parseEventLogs({
        abi: TOKEN_MESSENGER_EVENTS,
        logs: receipt.logs,
      })

      if (parsedLogs.length > 0) {
        const depositEvent = parseDepositForBurnEvent(parsedLogs[0])
        nonce = depositEvent.nonce
      }

      // Create V2 transfer object
      const transfer: CCTPV2Transfer = {
        sourceChain: Object.keys(CCTP_V2_NETWORKS).find(
          (key) => CCTP_V2_NETWORKS[key as CCTPV2Network].chainId === this.sourceNetwork.chainId,
        ) as CCTPV2Network,
        destinationChain: Object.keys(CCTP_V2_NETWORKS).find(
          (key) => CCTP_V2_NETWORKS[key as CCTPV2Network].chainId === this.destinationNetwork.chainId,
        ) as CCTPV2Network,
        amount,
        sourceAddress: userAddress,
        destinationAddress,
        nonce,
        burnTxHash: hash,
        status: "burned",
        timestamp: Date.now(),
        useFastTransfer,
        estimatedCompletionTime: estimatedTime,
        hookData: options.hookData,
      }

      console.log("[v0] CCTP V2 burn completed:", {
        hash,
        nonce: nonce.toString(),
        useFastTransfer,
        estimatedTime,
        hasHook: !!options.hookData,
      })

      return { hash, nonce, transfer }
    } catch (error) {
      console.error("[v0] CCTP V2 burn failed:", error)
      throw new Error(`Failed to burn USDC: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async mintUSDC(
    message: string,
    attestation: string,
    userAddress: Address,
  ): Promise<{ hash: Hash; receipt: TransactionReceipt }> {
    try {
      const destinationViemChain = getViemChain(this.destinationNetwork.chainId)

      const destinationWalletClient = createWalletClient({
        chain: destinationViemChain,
        transport: custom(window.ethereum),
      })

      const contractAddress = this.destinationNetwork.messageTransmitterV2 as Address

      const gasEstimate = await this.destinationPublicClient.estimateContractGas({
        address: contractAddress,
        abi: MESSAGE_TRANSMITTER_ABI,
        functionName: "receiveMessage",
        args: [message as `0x${string}`, attestation as `0x${string}`],
        account: userAddress,
      })

      const hash = await destinationWalletClient.writeContract({
        address: contractAddress,
        abi: MESSAGE_TRANSMITTER_ABI,
        functionName: "receiveMessage",
        args: [message as `0x${string}`, attestation as `0x${string}`],
        account: userAddress,
        gas: gasEstimate + BigInt(50000),
      })

      const receipt = await this.destinationPublicClient.waitForTransactionReceipt({ hash })

      console.log("[v0] CCTP V2 mint completed:", hash)
      return { hash, receipt }
    } catch (error) {
      console.error("[v0] CCTP V2 mint failed:", error)
      throw new Error(`Failed to mint USDC: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async isMessageUsed(messageHash: string): Promise<boolean> {
    try {
      const result = await this.destinationPublicClient.readContract({
        address: this.destinationNetwork.messageTransmitterV2 as Address,
        abi: MESSAGE_TRANSMITTER_ABI,
        functionName: "usedNonces",
        args: [messageHash as `0x${string}`],
      })

      return result > 0
    } catch (error) {
      console.error("[v0] Failed to check message status:", error)
      return false
    }
  }

  async getTransferEvents(fromBlock: bigint, toBlock: bigint): Promise<any[]> {
    try {
      const logs = await this.sourcePublicClient.getLogs({
        address: this.sourceNetwork.tokenMessengerV2 as Address,
        events: TOKEN_MESSENGER_EVENTS,
        fromBlock,
        toBlock,
      })

      return logs.map((log: Log) => ({
        ...parseDepositForBurnEvent(log),
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash,
      }))
    } catch (error) {
      console.error("[v0] Failed to get transfer events:", error)
      return []
    }
  }

  async estimateTransferCost(
    amount: string,
    userAddress: Address,
    options: TransferOptions = {},
  ): Promise<{
    burnGasCost: bigint
    mintGasCost: bigint
    totalCostETH: string
    fastTransferAvailable: boolean
    estimatedTime: number
  }> {
    try {
      const amountWei = parseUnits(amount, 6)
      const mintRecipient = `0x${userAddress.slice(2).padStart(64, "0")}` as `0x${string}`

      // Check Fast Transfer availability
      const fastTransferStatus = await this.checkFastTransferAvailability(amount)

      let burnGasEstimate: bigint
      try {
        if (options.hookData) {
          burnGasEstimate = await this.sourcePublicClient.estimateContractGas({
            address: this.sourceNetwork.tokenMessengerV2 as Address,
            abi: TOKEN_MESSENGER_ABI,
            functionName: "depositForBurnWithCaller",
            args: [
              amountWei,
              this.destinationNetwork.domain,
              mintRecipient,
              this.sourceNetwork.usdcAddress as Address,
              options.hookData.target as Address,
            ],
            account: userAddress,
          })
        } else {
          burnGasEstimate = await this.sourcePublicClient.estimateContractGas({
            address: this.sourceNetwork.tokenMessengerV2 as Address,
            abi: TOKEN_MESSENGER_ABI,
            functionName: "depositForBurn",
            args: [amountWei, this.destinationNetwork.domain, mintRecipient, this.sourceNetwork.usdcAddress as Address],
            account: userAddress,
          })
        }
      } catch (gasError) {
        console.log("[v0] Burn gas estimation failed, using fallback:", gasError)
        burnGasEstimate = BigInt(options.hookData ? 300000 : 200000)
      }

      const mintGasEstimate = BigInt(200000)

      const sourceGasPrice = await this.sourcePublicClient.getGasPrice()
      const destinationGasPrice = await this.destinationPublicClient.getGasPrice()

      const burnCost = burnGasEstimate * sourceGasPrice
      const mintCost = mintGasEstimate * destinationGasPrice
      const totalCost = burnCost + mintCost

      return {
        burnGasCost: burnCost,
        mintGasCost: mintCost,
        totalCostETH: formatUnits(totalCost, 18),
        fastTransferAvailable: fastTransferStatus.available,
        estimatedTime: fastTransferStatus.estimatedTime,
      }
    } catch (error) {
      console.error("[v0] Failed to estimate transfer cost:", error)
      throw error
    }
  }
}

// Export both V2 and legacy interfaces for compatibility
export const CCTPClient = CCTPV2Client
export type CCTPTransfer = CCTPV2Transfer
