export const CIRCLE_CONFIG = {
  // API URL for client-side requests to our backend
  apiUrl: "/api/circle",


  // Circle API endpoints
  endpoints: {
    sendUsdc: "/send-usdc",
    onramp: "/onramp",
    offramp: "/offramp",
    bridge: "/bridge",
    webhooks: "/webhooks",
  },
}

// Circle SDK initialization is now handled server-side in API routes

// Helper to check if Circle is properly configured (server-side only)
export const isCircleConfigured = () => {
  // This check now happens server-side in API routes
  return true // Always return true for client-side, actual check happens in API
}
