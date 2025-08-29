import { type NextRequest, NextResponse } from "next/server";
import { CCTP_V2_NETWORKS } from "@/lib/cctp-config"; // your actual network config

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletId, recipientAddress, amount, chainId } = body;

    if (!walletId || !recipientAddress || !amount || !chainId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: walletId, recipientAddress, amount, chainId" },
        { status: 400 }
      );
    }

    // Lookup the actual USDC contract for the selected chain
    const selectedChain = Object.values(CCTP_V2_NETWORKS).find(
      (c) => c.chainId.toString() === chainId.toString()
    );

    if (!selectedChain) {
      return NextResponse.json(
        { success: false, error: `Unsupported chainId: ${chainId}` },
        { status: 400 }
      );
    }

    const usdcContract = selectedChain.usdcAddress; // must exist in your CCTP_V2_NETWORKS

    if (!usdcContract) {
      return NextResponse.json(
        { success: false, error: `USDC contract not configured for chain ${chainId}` },
        { status: 500 }
      );
    }

    // Encode ERC-20 transfer
    const txData = `0xa9059cbb${recipientAddress.toLowerCase().replace(/^0x/, '').padStart(64, '0')}${(amount * 1_000_000).toString(16).padStart(64, '0')}`;

    return NextResponse.json({
      success: false,
      requiresWalletSignature: true,
      transactionData: {
        to: usdcContract,
        data: txData,
        value: "0x0",
        gasLimit: "0x5208", // adjust if needed
      },
      message: `Please approve the USDC transfer transaction in your wallet on ${selectedChain.name}`,
      usdcContract,
      network: selectedChain.name,
    });

  } catch (error) {
    console.error("[v0] Send USDC error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to prepare USDC transfer transaction" },
      { status: 500 }
    );
  }
}
