import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

// import { WagmiProvider } from 'wagmi'
// import { config } from '../wagmi/config'; 
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { Providers } from './providers/providers'

export const metadata: Metadata = {
  title: 'v0 App',
  description: 'Created with v0',
  generator: 'v0.dev',
}

// const queryClient = new QueryClient()

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">

        {/* <WagmiProvider config={config}> */}
           {/* <QueryClientProvider client={queryClient}> */}
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
        <body>
        <Providers>
          {children}
        </Providers>
      </body>
      {/* </QueryClientProvider> */}
      {/* </WagmiProvider> */}
    </html>
  )
}
