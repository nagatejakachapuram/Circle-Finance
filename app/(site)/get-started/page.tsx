"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { CheckCircle2, Loader2, Shield, Wallet } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { CardDescription } from "@/components/ui/card"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { useWallet } from "@/components/wallet-context"
import { GlassCard } from "@/components/glass-card"
import { FadeIn } from "@/components/motion"
import AuroraBg from "@/components/aurora-bg"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"

type Step = "wallet" | "kyc" | "review"

export default function GetStartedPage() {
  const router = useRouter()
  const { connected, connect, address } = useWallet()
  const { user } = useAuth()
  const [kycStatus, setKycStatus] = useState<"idle" | "pending" | "approved">("idle")
  const currentStep: Step = useMemo(() => {
    if (!user) return "wallet"
    if (!connected) return "wallet"
    if (kycStatus !== "approved") return "kyc"
    return "review"
  }, [connected, kycStatus])

  return (
    <div className="min-h-dvh bg-white relative overflow-hidden">
      <Header />
      <main className="container px-4 md:px-6 py-10 md:py-16 relative">
        <AuroraBg intensity={0.5} />
        <div className="max-w-3xl">
          <FadeIn>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">{"Get Started"}</h1>
          </FadeIn>
          <FadeIn delay={0.05}>
            <p className="text-muted-foreground mt-2">
              {"Onboard to Circle Pay in minutes. Connect your wallet, complete KYC, and begin investing."}
            </p>
          </FadeIn>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <FadeIn>
            <OnboardingStep
              index={1}
              title={user ? "Connect Wallet" : "Create Account"}
              active={currentStep === "wallet"}
              complete={user && connected}
              description={
                user 
                  ? connected 
                    ? `Connected: ${address?.slice(0, 6)}…${address?.slice(-4)}` 
                    : "Connect your wallet to continue."
                  : "Create your Circle Pay account first."
              }
              action={
                !user ? (
                  <Button asChild className="bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white hover:opacity-95">
                    <Link href="/auth/signup">
                      {"Create Account"}
                    </Link>
                  </Button>
                ) : !connected ? (
                  <Button onClick={connect} className="bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white hover:opacity-95">
                    <Wallet className="mr-2 size-4" />
                    {"Connect Wallet"}
                  </Button>
                ) : undefined
              }
            />
          </FadeIn>

          <FadeIn delay={0.06}>
            <OnboardingStep
              index={2}
              title="KYC Verification"
              active={currentStep === "kyc"}
              complete={kycStatus === "approved"}
              description={
                kycStatus === "approved"
                  ? "KYC approved"
                  : kycStatus === "pending"
                  ? "Submitting your information..."
                  : "Upload your info and verify identity."
              }
              action={
                user && connected && kycStatus === "idle" ? (
                  <Button
                    onClick={async () => {
                      setKycStatus("pending")
                      await new Promise((r) => setTimeout(r, 1500))
                      setKycStatus("approved")
                    }}
                    className="bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white hover:opacity-95"
                  >
                    <Shield className="mr-2 size-4" />
                    {"Start KYC"}
                  </Button>
                ) : kycStatus === "pending" ? (
                  <Button disabled className="bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white">
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    {"Processing"}
                  </Button>
                ) : kycStatus === "idle" && user && connected ? (
                  <Button
                    onClick={() => router.push('/kyc')}
                    className="bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white hover:opacity-95"
                  >
                    <Shield className="mr-2 size-4" />
                    {"Start Full KYC"}
                  </Button>
                ) : undefined
              }
            />
          </FadeIn>

          <FadeIn delay={0.12}>
            <OnboardingStep
              index={3}
              title="Review & Invest"
              active={currentStep === "review"}
              complete={currentStep === "review"}
              description={"You're ready to invest in tokenized properties."}
              action={
                currentStep === "review" ? (
                  <Button asChild className="bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white hover:opacity-95">
                    <Link href="/explore">{"Explore Estates"}</Link>
                  </Button>
                ) : undefined
              }
            />
          </FadeIn>
        </div>
      </main>
      <Footer />
    </div>
  )
}

function OnboardingStep({
  index = 1,
  title = "Step",
  description = "",
  action,
  active = false,
  complete = false,
}: {
  index?: number
  title?: string
  description?: string
  action?: React.ReactNode
  active?: boolean
  complete?: boolean
}) {
  return (
    <GlassCard className={active ? "ring-1 ring-[#3A86FF]/30" : ""}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
              complete ? "bg-[#3A86FF] text-white" : "bg-slate-100 text-foreground ring-1 ring-slate-200"
            }`}
            aria-hidden="true"
          >
            {complete ? <CheckCircle2 className="size-4" /> : index}
          </span>
          <div className="text-lg font-medium text-foreground">{title}</div>
        </div>
      </div>
      <CardDescription className="text-muted-foreground mt-2">{description}</CardDescription>
      <div className="mt-4">{action}</div>
    </GlassCard>
  )
}