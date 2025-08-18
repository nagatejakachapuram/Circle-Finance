import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
}

export function formatTimeAgo(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (days > 0) {
    return `${days} day${days > 1 ? "s" : ""} ago`
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? "s" : ""} ago`
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`
  } else {
    return "Just now"
  }
}

export function formatTransferProgress(status: string): { label: string; progress: number } {
  switch (status) {
    case "pending":
      return { label: "Initiating", progress: 10 }
    case "burned":
      return { label: "Awaiting Attestation", progress: 40 }
    case "attested":
      return { label: "Ready to Mint", progress: 80 }
    case "minted":
      return { label: "Completed", progress: 100 }
    case "failed":
      return { label: "Failed", progress: 0 }
    default:
      return { label: "Unknown", progress: 0 }
  }
}

export function getExplorerUrl(chainId: number, txHash: string): string {
  const explorers: Record<number, string> = {
    1: "https://etherscan.io",
    8453: "https://basescan.org",
    42161: "https://arbiscan.io",
    137: "https://polygonscan.com",
    11155111: "https://sepolia.etherscan.io", // Ethereum Sepolia
    84532: "https://sepolia-explorer.base.org", // Base Sepolia
    421614: "https://sepolia-explorer.arbitrum.io", // Arbitrum Sepolia
    80002: "https://amoy.polygonscan.com", // Polygon Amoy
  }

  const baseUrl = explorers[chainId] || "https://etherscan.io"
  return `${baseUrl}/tx/${txHash}`
}
