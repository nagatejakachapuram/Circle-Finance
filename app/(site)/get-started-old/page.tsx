"use client"

import type React from "react"

import { useMemo, useState } from "react"
import Link from "next/link"
import { CheckCircle2, Loader2, Shield, Wallet, User, FileCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { useWallet } from "@/components/wallet-context"
import { GlassCard } from "@/components/glass-card"
import { FadeIn } from "@/components/motion"

type OnchainIdStatus = "idle" | "pending" | "deployed"
type KycStatus = "idle" | "pending" | "approved"
type ClaimStatus = "idle" | "pending" | "added"

export default function GetStartedPage() {
  const { connected, connect, address } = useWallet()
  const [onchainIdStatus, setOnchainIdStatus] = useState<OnchainIdStatus>("idle")
  const [kycStatus, setKycStatus] = useState<KycStatus>("idle")
  const [claimStatus, setClaimStatus] = useState<ClaimStatus>("idle")
  const [selectedCountry, setSelectedCountry] = useState<string>("")

  const progress = useMemo(() => {
    let completed = 0
    if (connected) completed += 25
    if (onchainIdStatus === "deployed") completed += 25
    if (kycStatus === "approved") completed += 25
    if (claimStatus === "added") completed += 25
    return completed
  }, [connected, onchainIdStatus, kycStatus, claimStatus])

  const handleDeployIdentity = async () => {
    setOnchainIdStatus("pending")
    // Simulate onchain identity deployment
    await new Promise((r) => setTimeout(r, 2000))
    setOnchainIdStatus("deployed")
  }

  const handleKycVerification = async () => {
    if (!selectedCountry) return
    setKycStatus("pending")
    // Simulate KYC signature generation
    await new Promise((r) => setTimeout(r, 1500))
    setKycStatus("approved")
  }

  const handleAddClaim = async () => {
    setClaimStatus("pending")
    // Simulate adding KYC claim to onchain identity
    await new Promise((r) => setTimeout(r, 1500))
    setClaimStatus("added")
  }

  return (
    <div className="min-h-dvh bg-white relative overflow-hidden">
      <Header />
      <main className="container px-4 md:px-6 py-10 md:py-16 relative">
        <div className="max-w-4xl">
          <FadeIn>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">{"KYC Verification"}</h1>
          </FadeIn>
          <FadeIn delay={0.05}>
            <p className="text-muted-foreground mt-2">
              {
                "Complete your Know Your Customer verification to access advanced trading features. This process creates your onchain identity and verifies your credentials."
              }
            </p>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="text-foreground font-medium">{progress}%</span>
              </div>
              <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#3A86FF] to-[#1f6fff] transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </FadeIn>
        </div>

        <div className="mt-8 space-y-6">
          <FadeIn>
            <OnchainKycStep
              icon={Wallet}
              title="Connect Wallet"
              description={
                connected ? "Connect your wallet to start the KYC process" : "Please connect your wallet to continue"
              }
              status={connected ? "complete" : "pending"}
              statusText={connected ? "In Progress" : "Pending"}
              action={
                !connected ? (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-3">Use the connect button in the header</p>
                  </div>
                ) : undefined
              }
            />
          </FadeIn>

          <FadeIn delay={0.06}>
            <OnchainKycStep
              icon={User}
              title="Create OnchainID"
              description="Deploy your onchain identity"
              status={onchainIdStatus === "deployed" ? "complete" : connected ? "active" : "pending"}
              statusText={onchainIdStatus === "deployed" ? "Complete" : connected ? "Pending" : "Pending"}
              action={
                connected && onchainIdStatus === "idle" ? (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-foreground mb-2">Create Your Onchain Identity</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      This will deploy a unique onchain identity for your wallet address. This identity will be used for
                      KYC verification and future interactions.
                    </p>
                    <Button
                      onClick={handleDeployIdentity}
                      className="bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white hover:opacity-95"
                    >
                      Deploy Identity
                    </Button>
                  </div>
                ) : onchainIdStatus === "pending" ? (
                  <div className="mt-4">
                    <Button disabled className="bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white">
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Deploying...
                    </Button>
                  </div>
                ) : undefined
              }
            />
          </FadeIn>

          <FadeIn delay={0.12}>
            <OnchainKycStep
              icon={Shield}
              title="KYC Verification"
              description="Complete KYC verification with signature"
              status={kycStatus === "approved" ? "complete" : onchainIdStatus === "deployed" ? "active" : "pending"}
              statusText={
                kycStatus === "approved" ? "Complete" : onchainIdStatus === "deployed" ? "Pending" : "Pending"
              }
              action={
                onchainIdStatus === "deployed" && kycStatus === "idle" ? (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-foreground mb-2">Complete KYC Verification</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Select your country and submit for KYC verification. This will generate a cryptographic signature
                      for your identity.
                    </p>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-foreground">Country</label>
                        <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                          <SelectTrigger className="mt-1 bg-white border-slate-200 text-foreground">
                            <SelectValue placeholder="Select your country" />
                          </SelectTrigger>
                          <SelectContent className="bg-white text-foreground border-slate-200">
                            <SelectItem value="US">United States</SelectItem>
                            <SelectItem value="CA">Canada</SelectItem>
                            <SelectItem value="GB">United Kingdom</SelectItem>
                            <SelectItem value="DE">Germany</SelectItem>
                            <SelectItem value="FR">France</SelectItem>
                            <SelectItem value="JP">Japan</SelectItem>
                            <SelectItem value="AU">Australia</SelectItem>
                            <SelectItem value="SG">Singapore</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        onClick={handleKycVerification}
                        disabled={!selectedCountry}
                        className="bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white hover:opacity-95 disabled:opacity-50"
                      >
                        Get KYC Signature
                      </Button>
                    </div>
                  </div>
                ) : kycStatus === "pending" ? (
                  <div className="mt-4">
                    <Button disabled className="bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white">
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Generating Signature...
                    </Button>
                  </div>
                ) : undefined
              }
            />
          </FadeIn>

          <FadeIn delay={0.18}>
            <OnchainKycStep
              icon={FileCheck}
              title="Add Claim to Identity"
              description="Add KYC claim to your onchain identity"
              status={claimStatus === "added" ? "complete" : kycStatus === "approved" ? "active" : "pending"}
              statusText={claimStatus === "added" ? "Complete" : kycStatus === "approved" ? "Pending" : "Pending"}
              action={
                kycStatus === "approved" && claimStatus === "idle" ? (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-foreground mb-2">Add KYC Claim to Identity</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add KYC claim to your onchain identity to complete the verification process.
                    </p>
                    <Button
                      onClick={handleAddClaim}
                      className="bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white hover:opacity-95"
                    >
                      Add KYC Claim
                    </Button>
                  </div>
                ) : claimStatus === "pending" ? (
                  <div className="mt-4">
                    <Button disabled className="bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white">
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Adding Claim...
                    </Button>
                  </div>
                ) : claimStatus === "added" ? (
                  <div className="mt-4">
                    <div className="flex items-center gap-2 text-sm text-green-600 mb-3">
                      <CheckCircle2 className="size-4" />
                      KYC verification complete! You can now access all features.
                    </div>
                    <Button
                      asChild
                      className="bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white hover:opacity-95"
                    >
                      <Link href="/explore">Explore Estates</Link>
                    </Button>
                  </div>
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

function OnchainKycStep({
  icon: Icon,
  title,
  description,
  status,
  statusText,
  action,
}: {
  icon: any
  title: string
  description: string
  status: "pending" | "active" | "complete"
  statusText: string
  action?: React.ReactNode
}) {
  return (
    <GlassCard className={`${status === "active" ? "ring-1 ring-[#3A86FF]/30" : ""} transition-all`}>
      <div className="flex items-start gap-4">
        <div
          className={`rounded-xl p-2 ring-1 ${
            status === "complete"
              ? "bg-[#3A86FF] ring-[#3A86FF] text-white"
              : status === "active"
                ? "bg-slate-50 ring-[#3A86FF] text-[#3A86FF]"
                : "bg-slate-50 ring-slate-200 text-slate-400"
          }`}
        >
          <Icon className="size-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-foreground">{title}</h3>
            <span
              className={`text-sm px-2 py-1 rounded-full ${
                status === "complete"
                  ? "bg-green-100 text-green-700"
                  : status === "active"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-slate-100 text-slate-600"
              }`}
            >
              {statusText}
            </span>
          </div>
          <CardDescription className="text-muted-foreground mt-1">{description}</CardDescription>
          {action}
        </div>
      </div>
    </GlassCard>
  )
}
