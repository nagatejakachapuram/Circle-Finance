"use client"

import Providers from "@/app/providers"

export default function LayoutClient({ children }: { children?: React.ReactNode }) {
  return <Providers>{children}</Providers>
}
