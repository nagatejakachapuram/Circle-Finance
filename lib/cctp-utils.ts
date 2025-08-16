import { keccak256, encodePacked, type Hash } from "viem"

export function generateMessageHash(
  version: number,
  sourceDomain: number,
  destinationDomain: number,
  nonce: bigint,
  sender: string,
  recipient: string,
  messageBody: string,
): Hash {
  const encoded = encodePacked(
    ["uint32", "uint32", "uint32", "uint64", "bytes32", "bytes32", "bytes"],
    [
      version,
      sourceDomain,
      destinationDomain,
      nonce,
      sender as `0x${string}`,
      recipient as `0x${string}`,
      messageBody as `0x${string}`,
    ],
  )

  return keccak256(encoded)
}

export function formatTransferStatus(status: string): string {
  switch (status) {
    case "pending":
      return "Initiating Transfer"
    case "burned":
      return "USDC Burned - Awaiting Attestation"
    case "attested":
      return "Attestation Received - Ready to Mint"
    case "minted":
      return "Transfer Complete"
    case "failed":
      return "Transfer Failed"
    default:
      return "Unknown Status"
  }
}

export function getExplorerUrl(chainId: number, txHash: string): string {
  const explorers: Record<number, string> = {
    1: "https://etherscan.io",
    8453: "https://basescan.org",
    42161: "https://arbiscan.io",
    137: "https://polygonscan.com",
  }

  const baseUrl = explorers[chainId] || "https://etherscan.io"
  return `${baseUrl}/tx/${txHash}`
}

export function validateCCTPTransfer(
  sourceChain: string,
  destinationChain: string,
  amount: string,
): { isValid: boolean; error?: string } {
  if (sourceChain === destinationChain) {
    return { isValid: false, error: "Source and destination chains cannot be the same" }
  }

  const amountNum = Number.parseFloat(amount)
  if (isNaN(amountNum) || amountNum <= 0) {
    return { isValid: false, error: "Amount must be a positive number" }
  }

  if (amountNum < 0.01) {
    return { isValid: false, error: "Minimum transfer amount is 0.01 USDC" }
  }

  return { isValid: true }
}

export function calculateTransferTime(sourceChain: string, destinationChain: string): string {
  // Typical CCTP transfer times based on network congestion
  const baseTimes: Record<string, number> = {
    ethereum: 15, // minutes
    base: 2,
    arbitrum: 5,
    polygon: 10,
  }

  const sourceTime = baseTimes[sourceChain] || 10
  const destTime = baseTimes[destinationChain] || 10
  const attestationTime = 5 // Circle attestation service time

  const totalMinutes = Math.max(sourceTime, destTime) + attestationTime

  if (totalMinutes < 60) {
    return `~${totalMinutes} minutes`
  } else {
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return minutes > 0 ? `~${hours}h ${minutes}m` : `~${hours}h`
  }
}
