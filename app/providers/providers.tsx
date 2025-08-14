// app/providers.tsx

"use client"; // 👈 Mark as a Client Component

import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet, sepolia, polygonAmoy } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Setup queryClient
const queryClient = new QueryClient();

// Your wagmi config
export const config = createConfig({
  chains: [polygonAmoy],
  transports: {
    [polygonAmoy.id]: http("https://api.zan.top/polygon-amoy")
  },
});


export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}