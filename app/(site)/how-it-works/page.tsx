"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Shield, Wallet, Building2, Banknote } from 'lucide-react'
import Header from "@/components/header"
import Footer from "@/components/footer"
import { FadeIn } from "@/components/motion"
import { GlassCard } from "@/components/glass-card"
// import AuroraBg from "@/components/aurora-bg"

const steps = [
  {
    title: "Connect Wallet",
    description:
      "Authenticate using your self-custodied wallet. Non-custodial by design for maximum control.",
    icon: Wallet,
  },
  {
    title: "KYC & Onboarding",
    description:
      "Verify your identity in minutes. We guide you with clear status and feedback.",
    icon: Shield,
  },
  {
    title: "Invest On-Chain",
    description:
      "Access tokenized real estate via ERC‑3643. Transactions settle fully on-chain.",
    icon: Building2,
  },
  {
    title: "Earn Rent in USDC",
    description:
      "Receive programmatic rent distributions in USDC via supported networks with CCTP.",
    icon: Banknote,
  },
]

export default function HowItWorksPage() {
  return (
    <div className="min-h-dvh bg-white relative overflow-hidden">
      <Header />
      <main className="container px-4 md:px-6 py-12 md:py-20 relative">
        {/* <AuroraBg intensity={0.6} /> */}
        <div className="max-w-3xl">
          <FadeIn>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
              {"How it works"}
            </h1>
          </FadeIn>
          <FadeIn delay={0.05}>
            <p className="text-muted-foreground mt-3">
              {"A compliant, USDC-native workflow designed for trust, transparency, and speed."}
            </p>
          </FadeIn>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {steps.map((s, i) => (
            <FadeIn key={s.title} delay={i * 0.06}>
              <GlassCard>
                <div className="flex items-center gap-3">
                  <s.icon className="size-6 text-[#3A86FF]" aria-hidden="true" />
                  <h3 className="text-lg font-medium text-foreground">{s.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{s.description}</p>
              </GlassCard>
            </FadeIn>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          <Button asChild className="bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white hover:opacity-95">
            <Link href="/get-started">{"Start KYC"}</Link>
          </Button>
          <Button asChild variant="outline" className="border-slate-200 text-foreground hover:bg-slate-100">
            <Link href="/explore">{"Explore Estates"}</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  )
}
