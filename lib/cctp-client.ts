import {
  createPublicClient,
  createWalletClient,
  custom,
  parseUnits,
  formatUnits,
  type Hash,
  type Address,
  parseEventLogs,
  type TransactionReceipt,
} from "viem"
import { CCTP_NETWORKS, type CCTPNetwork, type NetworkConfig } from "./cctp-config"
import {
  TOKEN_MESSENGER_ABI,
  MESSAGE_TRANSMITTER_ABI,
  ERC20_ABI,
  TOKEN_MESSENGER_EVENTS,
  parseDepositForBurnEvent,
} from "./cctp-contracts"

export interface CCTPTransfer {
  sourceChain: CCTPNetwork
  destinationChain: CCTPNetwork
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
}

export class CCTPClient {
  private sourceNetwork: NetworkConfig
  private destinationNetwork: NetworkConfig
  private sourcePublicClient: any
  private destinationPublicClient: any
  private walletClient: any

  constructor(sourceChain: CCTPNetwork, destinationChain: CCTPNetwork) {
    this.sourceNetwork = CCTP_NETWORKS[sourceChain]
    this.destinationNetwork = CCTP_NETWORKS[destinationChain]

    // Initialize source chain clients
    this.sourcePublicClient = createPublicClient({
      chain: {
        id: this.sourceNetwork.chainId,
        name: this.sourceNetwork.name,
        network: sourceChain,
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        rpcUrls: {
          default: { http: [this.sourceNetwork.rpcUrl] },
          public: { http: [this.sourceNetwork.rpcUrl] },
        },
      },
      transport: custom(window.ethereum),
    })

    // Initialize destination chain client
    this.destinationPublicClient = createPublicClient({
      chain: {
        id: this.destinationNetwork.chainId,
        name: this.destinationNetwork.name,
        network: destinationChain,
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        rpcUrls: {
          default: { http: [this.destinationNetwork.rpcUrl] },
          public: { http: [this.destinationNetwork.rpcUrl] },
        },
      },
      transport: custom(window.ethereum),
    })

    this.walletClient = createWalletClient({
      chain: {
        id: this.sourceNetwork.chainId,
        name: this.sourceNetwork.name,
        network: sourceChain,
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        rpcUrls: {
          default: { http: [this.sourceNetwork.rpcUrl] },
          public: { http: [this.sourceNetwork.rpcUrl] },
        },
      },
      transport: custom(window.ethereum),
    })
  }

  async getUSDCBalance(userAddress: Address): Promise<string> {
    const balance = await this.sourcePublicClient.readContract({
      address: this.sourceNetwork.usdcAddress as Address,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [userAddress],
    })

    return formatUnits(balance, 6) // USDC has 6 decimals
  }

  async approveUSDC(userAddress: Address, amount: string): Promise<Hash> {
    const amountWei = parseUnits(amount, 6)

    const hash = await this.walletClient.writeContract({
      address: this.sourceNetwork.usdcAddress as Address,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [this.sourceNetwork.tokenMessenger as Address, amountWei],
      account: userAddress,
    })

    return hash
  }

  async burnUSDC(
    userAddress: Address,
    amount: string,
    destinationAddress: Address,
  ): Promise<{ hash: Hash; nonce: bigint; transfer: CCTPTransfer }> {
    try {
      const amountWei = parseUnits(amount, 6)

      // Convert destination address to bytes32
      const mintRecipient = `0x${destinationAddress.slice(2).padStart(64, "0")}` as `0x${string}`

      // Estimate gas first
      const gasEstimate = await this.sourcePublicClient.estimateContractGas({
        address: this.sourceNetwork.tokenMessenger as Address,
        abi: TOKEN_MESSENGER_ABI,
        functionName: "depositForBurn",
        args: [amountWei, this.destinationNetwork.domain, mintRecipient, this.sourceNetwork.usdcAddress as Address],
        account: userAddress,
      })

      // Execute the burn transaction
      const { request } = await this.sourcePublicClient.simulateContract({
        address: this.sourceNetwork.tokenMessenger as Address,
        abi: TOKEN_MESSENGER_ABI,
        functionName: "depositForBurn",
        args: [amountWei, this.destinationNetwork.domain, mintRecipient, this.sourceNetwork.usdcAddress as Address],
        account: userAddress,
        gas: gasEstimate + BigInt(50000), // Add buffer
      })

      const hash = await this.walletClient.writeContract(request)

      // Wait for transaction receipt and parse events
      const receipt = await this.sourcePublicClient.waitForTransactionReceipt({ hash })
      const parsedLogs = parseEventLogs({
        abi: TOKEN_MESSENGER_EVENTS,
        logs: receipt.logs,
      })

      let nonce = BigInt(0)
      if (parsedLogs.length > 0) {
        const depositEvent = parseDepositForBurnEvent(parsedLogs[0])
        nonce = depositEvent.nonce
      }

      // Create transfer object
      const transfer: CCTPTransfer = {
        sourceChain: Object.keys(CCTP_NETWORKS).find(
          (key) => CCTP_NETWORKS[key as CCTPNetwork].chainId === this.sourceNetwork.chainId,
        ) as CCTPNetwork,
        destinationChain: Object.keys(CCTP_NETWORKS).find(
          (key) => CCTP_NETWORKS[key as CCTPNetwork].chainId === this.destinationNetwork.chainId,
        ) as CCTPNetwork,
        amount,
        sourceAddress: userAddress,
        destinationAddress,
        nonce,
        burnTxHash: hash,
        status: "burned",
        timestamp: Date.now(),
      }

      return { hash, nonce, transfer }
    } catch (error) {
      console.error("[v0] CCTP burn failed:", error)
      throw new Error(`Failed to burn USDC: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async mintUSDC(
    message: string,
    attestation: string,
    userAddress: Address,
  ): Promise<{ hash: Hash; receipt: TransactionReceipt }> {
    try {
      // Create destination network wallet client
      const destinationWalletClient = createWalletClient({
        chain: {
          id: this.destinationNetwork.chainId,
          name: this.destinationNetwork.name,
          network: Object.keys(CCTP_NETWORKS).find(
            (key) => CCTP_NETWORKS[key as CCTPNetwork].chainId === this.destinationNetwork.chainId,
          ) as string,
          nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
          rpcUrls: {
            default: { http: [this.destinationNetwork.rpcUrl] },
            public: { http: [this.destinationNetwork.rpcUrl] },
          },
        },
        transport: custom(window.ethereum),
      })

      // Estimate gas for mint transaction
      const gasEstimate = await this.destinationPublicClient.estimateContractGas({
        address: this.destinationNetwork.messageTransmitter as Address,
        abi: MESSAGE_TRANSMITTER_ABI,
        functionName: "receiveMessage",
        args: [message as `0x${string}`, attestation as `0x${string}`],
        account: userAddress,
      })

      // Execute mint transaction
      const hash = await destinationWalletClient.writeContract({
        address: this.destinationNetwork.messageTransmitter as Address,
        abi: MESSAGE_TRANSMITTER_ABI,
        functionName: "receiveMessage",
        args: [message as `0x${string}`, attestation as `0x${string}`],
        account: userAddress,
        gas: gasEstimate + BigInt(50000), // Add buffer
      })

      // Wait for transaction receipt
      const receipt = await this.destinationPublicClient.waitForTransactionReceipt({ hash })

      return { hash, receipt }
    } catch (error) {
      console.error("[v0] CCTP mint failed:", error)
      throw new Error(`Failed to mint USDC: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async isMessageUsed(messageHash: string): Promise<boolean> {
    try {
      const result = await this.destinationPublicClient.readContract({
        address: this.destinationNetwork.messageTransmitter as Address,
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
        address: this.sourceNetwork.tokenMessenger as Address,
        events: TOKEN_MESSENGER_EVENTS,
        fromBlock,
        toBlock,
      })

      return logs.map((log) => ({
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
  ): Promise<{
    burnGasCost: bigint
    mintGasCost: bigint
    totalCostETH: string
  }> {
    try {
      const amountWei = parseUnits(amount, 6)
      const mintRecipient = `0x${userAddress.slice(2).padStart(64, "0")}` as `0x${string}`

      // Estimate burn gas cost
      const burnGasEstimate = await this.sourcePublicClient.estimateContractGas({
        address: this.sourceNetwork.tokenMessenger as Address,
        abi: TOKEN_MESSENGER_ABI,
        functionName: "depositForBurn",
        args: [amountWei, this.destinationNetwork.domain, mintRecipient, this.sourceNetwork.usdcAddress as Address],
        account: userAddress,
      })

      // Estimate mint gas cost (approximate)
      const mintGasEstimate = BigInt(200000) // Typical mint gas cost

      // Get current gas prices
      const sourceGasPrice = await this.sourcePublicClient.getGasPrice()
      const destinationGasPrice = await this.destinationPublicClient.getGasPrice()

      const burnCost = burnGasEstimate * sourceGasPrice
      const mintCost = mintGasEstimate * destinationGasPrice
      const totalCost = burnCost + mintCost

      return {
        burnGasCost: burnCost,
        mintGasCost: mintCost,
        totalCostETH: formatUnits(totalCost, 18),
      }
    } catch (error) {
      console.error("[v0] Failed to estimate transfer cost:", error)
      throw error
    }
  }
}
