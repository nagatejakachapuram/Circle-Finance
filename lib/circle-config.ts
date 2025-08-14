export const CIRCLE_CONFIG = {
  // These would typically come from environment variables in production
  apiUrl: process.env.NEXT_PUBLIC_CIRCLE_API_URL || "/api/circle",
  clientKey: process.env.NEXT_PUBLIC_CIRCLE_CLIENT_KEY || "your-client-key-here",
  webhookSecret: process.env.CIRCLE_WEBHOOK_SECRET || "your-webhook-secret",

  // Circle API endpoints
  endpoints: {
    sendUsdc: "/send-usdc",
    onramp: "/onramp",
    offramp: "/offramp",
    bridge: "/bridge",
    webhooks: "/webhooks",
  },
}

// Circle SDK initialization (client-side)
export const initializeCircleSDK = () => {
  // This would initialize Circle's Web3 Services SDK
  // with the client-side key for browser operations
  return {
    clientKey: CIRCLE_CONFIG.clientKey,
    environment: "sandbox", // or 'production'
  }
}
