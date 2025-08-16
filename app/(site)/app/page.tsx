"use client"

import { useState, useEffect } from "react"
import { CheckCircle2, Wallet, User, Shield, Plus, ChevronRight, Building, TrendingUp, Landmark, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { useWallet } from "@/components/wallet-context"
import { GlassCard } from "@/components/glass-card"
import { FadeIn } from "@/components/motion"
import { useIsMobile } from "@/components/ui/use-mobile"
import Link from "next/link"

// Define the base URL for your Express server
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type KYCStep = "wallet" | "onchain-id" | "kyc-verification" | "add-claim" | "complete"

// Map country names to their ISO 3166-1 numeric codes
const countryMap: { [key: string]: number } = {
  "United States": 840,
  "United Kingdom": 826,
  "Canada": 124,
  "Australia": 36,
  "Germany": 276,
  "France": 250,
  "Japan": 392,
  "Singapore": 702,
  "Switzerland": 756,
  "Netherlands": 528,
};

// Use the keys of the map for the dropdown list
const countries = Object.keys(countryMap);

export default function AppPage() {
  const { connected, connect, address, isConnecting } = useWallet()
  const isMobile = useIsMobile()
  const [currentStep, setCurrentStep] = useState<KYCStep>("wallet")
  const [selectedCountry, setSelectedCountry] = useState<string>("")
  const [onchainIdDeployed, setOnchainIdDeployed] = useState(false)
  const [identityAddress, setIdentityAddress] = useState<string>("") // Store the deployed contract address
  const [kycSignature, setKycSignature] = useState<string>("")
  const [claimAdded, setClaimAdded] = useState(false)

  // Loading states for API calls
  const [isDeploying, setIsDeploying] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  // --- CHANGE START: Add state to track initial identity check ---
  const [isCheckingForExistingIdentity, setIsCheckingForExistingIdentity] = useState(false);
  // --- CHANGE END ---

  // --- CHANGE START: New effect to check for existing identity on wallet connect ---
  useEffect(() => {
    const checkForExistingIdentity = async () => {
      if (!address) {
        setCurrentStep("wallet");
        return;
      }

      setIsCheckingForExistingIdentity(true);
      try {
        const response = await fetch(`${API_BASE_URL}/identity/${address}`);
        const data = await response.json();
        const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

        if (response.ok && data.identityAddress && data.identityAddress !== ZERO_ADDRESS) {
          console.log("Existing identity found:", data.identityAddress);
          // An identity exists, so we can skip the entire process.
          setIdentityAddress(data.identityAddress);
          setOnchainIdDeployed(true);
          setClaimAdded(true); // It's registered, so the claim is effectively added.
          setKycSignature("0x-retrieved-from-existing-identity"); // Mock signature to show completion
          setCurrentStep("complete");
        } else {
          // No identity found, start the process from the beginning.
          setCurrentStep("onchain-id");
        }
      } catch (error) {
        console.error("Error checking for existing identity, proceeding with normal flow:", error);
        setCurrentStep("onchain-id");
      } finally {
        setIsCheckingForExistingIdentity(false);
      }
    };

    if (connected) {
      checkForExistingIdentity();
    }
  }, [connected, address]); // Rerun when connection status or address changes.
  // --- CHANGE END ---

  const getStepStatus = (step: KYCStep) => {
    const stepOrder: KYCStep[] = ["wallet", "onchain-id", "kyc-verification", "add-claim", "complete"]
    const currentIndex = stepOrder.indexOf(currentStep)
    const stepIndex = stepOrder.indexOf(step)

    if (stepIndex < currentIndex) return "complete"
    if (stepIndex === currentIndex) return "in-progress"
    return "pending"
  }

  const getProgress = () => {
    const steps: KYCStep[] = ["wallet", "onchain-id", "kyc-verification", "add-claim", "complete"]
    const currentIndex = steps.indexOf(currentStep)
    return (currentIndex / (steps.length - 1)) * 100
  }

  const handleDeployIdentity = async () => {
    if (!address) {
      console.error("Wallet address is not available.");
      return;
    }
    setIsDeploying(true);
    try {
      const response = await fetch(`${API_BASE_URL}/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAddress: address }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to deploy identity proxy');
      }

      const data = await response.json();
      console.log("Successfully deployed identity at:", data.address);
      setIdentityAddress(data.address); // Save the deployed address
      setOnchainIdDeployed(true);
      setCurrentStep("kyc-verification");

    } catch (error) {
      console.error("An error occurred during identity deployment:", error);
    } finally {
      setIsDeploying(false);
    }
  }

  const handleGetKYCSignature = async () => {
    if (!selectedCountry) return
    // This remains a mock as per the original code.
    await new Promise((resolve) => setTimeout(resolve, 1500))
    const mockSignature = `0x${Math.random().toString(16).substr(2, 64)}`
    setKycSignature(mockSignature)
    setCurrentStep("add-claim")
  }

  const handleRegisterIdentity = async () => {
    const numericCountryCode = countryMap[selectedCountry];
    if (!address || !identityAddress || !numericCountryCode) {
      console.error("Missing required data for registration.");
      return;
    }

    setIsRegistering(true);
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: address,
          identityAddress: identityAddress,
          countryCode: numericCountryCode
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to register identity');
      }

      const data = await response.json();
      console.log("Successfully registered identity with tx:", data.transactionHash);
      setClaimAdded(true);
      setCurrentStep("complete");

    } catch (error) {
      console.error("An error occurred during identity registration:", error);
    } finally {
      setIsRegistering(false);
    }
  }

  // --- CHANGE START: Add a loading indicator during the initial check ---
  if (isCheckingForExistingIdentity) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-blue-500" />
          <p className="mt-4 text-lg text-muted-foreground">Checking for existing identity...</p>
        </div>
      </div>
    );
  }
  // --- CHANGE END ---

  return (
    <div className="flex-1 space-y-6 p-6">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(1200px 800px at 50% 0%, rgba(58,134,255,0.08), transparent 60%), radial-gradient(900px 600px at 100% 0%, rgba(58,134,255,0.12), transparent 60%), #ffffff",
        }}
      />

      <FadeIn>
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight text-foreground mb-4">
            KYC Verification
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Complete your onchain identity verification to access tokenized real estate investments
          </p>

          <div className="mt-6 md:mt-8 max-w-md mx-auto">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>Progress</span>
              <span>{Math.round(getProgress())}%</span>
            </div>
            <Progress value={getProgress()} className="h-2" />
          </div>
        </div>
      </FadeIn>

      <div className="space-y-4 md:space-y-6">
        <FadeIn delay={0.1}>
          <GlassCard className="p-4 md:p-6">
            <div className="flex items-start gap-3 md:gap-4">
              <div
                className={`p-2 md:p-3 rounded-full ${getStepStatus("wallet") === "complete"
                    ? "bg-green-100 text-green-600"
                    : getStepStatus("wallet") === "in-progress"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-slate-100 text-slate-400"
                  }`}
              >
                {getStepStatus("wallet") === "complete" ? (
                  <CheckCircle2 className="size-5 md:size-6" />
                ) : (
                  <Wallet className="size-5 md:size-6" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-base md:text-lg font-medium text-foreground">Connect Wallet</h3>
                </div>
                <p className="text-muted-foreground mb-4 text-sm md:text-base">
                  {connected ? "Wallet connected successfully" : "Please connect your wallet to continue"}
                </p>
                {!connected && (
                  <Button
                    onClick={connect}
                    disabled={isConnecting}
                    className={`bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white disabled:opacity-50 ${isMobile ? "h-12 px-6" : ""}`}
                  >
                    <Wallet className="mr-2 size-4" />
                    Connect Wallet
                  </Button>
                )}
                {connected && (
                  <div className="text-sm text-muted-foreground">
                    Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
                  </div>
                )}
              </div>
            </div>
          </GlassCard>
        </FadeIn>

        <FadeIn delay={0.2}>
          <GlassCard className="p-4 md:p-6">
            <div className="flex items-start gap-3 md:gap-4">
              <div
                className={`p-2 md:p-3 rounded-full ${getStepStatus("onchain-id") === "complete"
                    ? "bg-green-100 text-green-600"
                    : getStepStatus("onchain-id") === "in-progress"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-slate-100 text-slate-400"
                  }`}
              >
                {getStepStatus("onchain-id") === "complete" ? (
                  <CheckCircle2 className="size-5 md:size-6" />
                ) : (
                  <User className="size-5 md:size-6" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-base md:text-lg font-medium text-foreground">Create OnchainID</h3>
                </div>
                <p className="text-muted-foreground mb-4 text-sm md:text-base">
                  Deploy your onchain identity contract to store verified claims
                </p>
                {getStepStatus("onchain-id") === "in-progress" && !onchainIdDeployed && (
                  <Button
                    onClick={handleDeployIdentity}
                    disabled={isDeploying}
                    className={`bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white ${isMobile ? "h-12 px-6" : ""}`}
                  >
                    {isDeploying ? <><Loader2 className="mr-2 size-4 animate-spin" /> Deploying...</> : <>Deploy Identity <ChevronRight className="ml-2 size-4" /></>}
                  </Button>
                )}
                {onchainIdDeployed && <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg"><p className="text-sm text-green-700 font-medium">Identity Deployed</p><p className="text-xs text-green-600 font-mono mt-1 break-all">{identityAddress}</p></div>}
              </div>
            </div>
          </GlassCard>
        </FadeIn>

        <FadeIn delay={0.3}>
          <GlassCard className="p-4 md:p-6">
            <div className="flex items-start gap-3 md:gap-4">
              <div
                className={`p-2 md:p-3 rounded-full ${getStepStatus("kyc-verification") === "complete"
                    ? "bg-green-100 text-green-600"
                    : getStepStatus("kyc-verification") === "in-progress"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-slate-100 text-slate-400"
                  }`}
              >
                {getStepStatus("kyc-verification") === "complete" ? (
                  <CheckCircle2 className="size-5 md:size-6" />
                ) : (
                  <Shield className="size-5 md:size-6" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-base md:text-lg font-medium text-foreground">KYC Verification</h3>
                </div>
                <p className="text-muted-foreground mb-4 text-sm md:text-base">
                  Complete KYC verification and get your cryptographic signature
                </p>
                {getStepStatus("kyc-verification") === "in-progress" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Select Country</label>
                      <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                        <SelectTrigger className="w-full max-w-xs">
                          <SelectValue placeholder="Choose your country" />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country} value={country}>
                              {country}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={handleGetKYCSignature}
                      disabled={!selectedCountry}
                      className={`bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white disabled:opacity-50 ${isMobile ? "h-12 px-6" : ""}`}
                    >
                      Get KYC Signature
                      <ChevronRight className="ml-2 size-4" />
                    </Button>
                  </div>
                )}
                {kycSignature && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700 font-medium">KYC Signature Generated</p>
                    <p className="text-xs text-green-600 font-mono mt-1 break-all">{kycSignature}</p>
                  </div>
                )}
              </div>
            </div>
          </GlassCard>
        </FadeIn>

        <FadeIn delay={0.4}>
          <GlassCard className="p-4 md:p-6">
            <div className="flex items-start gap-3 md:gap-4">
              <div
                className={`p-2 md:p-3 rounded-full ${getStepStatus("add-claim") === "complete"
                    ? "bg-green-100 text-green-600"
                    : getStepStatus("add-claim") === "in-progress"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-slate-100 text-slate-400"
                  }`}
              >
                {getStepStatus("add-claim") === "complete" ? (
                  <CheckCircle2 className="size-5 md:size-6" />
                ) : (
                  <Plus className="size-5 md:size-6" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-base md:text-lg font-medium text-foreground">Add Claim to Identity</h3>
                </div>
                <p className="text-muted-foreground mb-4 text-sm md:text-base">
                  Add your KYC verification claim to your onchain identity
                </p>
                {getStepStatus("add-claim") === "in-progress" && !claimAdded && (
                  <Button
                    onClick={handleRegisterIdentity}
                    disabled={isRegistering}
                    className={`bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white ${isMobile ? "h-12 px-6" : ""}`}
                  >
                    {isRegistering ? <><Loader2 className="mr-2 size-4 animate-spin" /> Registering...</> : <>Register Identity <ChevronRight className="ml-2 size-4" /></>}
                  </Button>
                )}
              </div>
            </div>
          </GlassCard>
        </FadeIn>

        {currentStep === "complete" && (
          <FadeIn delay={0.5}>
            <GlassCard className="p-8 text-center">
              <div className="p-4 bg-green-100 text-green-600 rounded-full w-fit mx-auto mb-4">
                <CheckCircle2 className="size-8" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">KYC Verification Complete!</h3>
              <p className="text-muted-foreground mb-6">
                Your onchain identity is verified and ready for tokenized investments
              </p>

              <div className="grid gap-4 sm:grid-cols-3 mb-6">
                <Button
                  asChild
                  className="bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white h-auto p-4 flex-col"
                >
                  <Link href="/app/explore">
                    <Building className="size-6 mb-2" />
                    <span className="font-medium">Explore Estates</span>
                    <span className="text-xs opacity-90">Tokenized Real Estate</span>
                  </Link>
                </Button>

                <Button
                  asChild
                  className="bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white h-auto p-4 flex-col"
                >
                  <Link href="/app/index-funds">
                    <TrendingUp className="size-6 mb-2" />
                    <span className="font-medium">Index Funds</span>
                    <span className="text-xs opacity-90">Tokenized Portfolios</span>
                  </Link>
                </Button>

                <Button
                  asChild
                  className="bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white h-auto p-4 flex-col"
                >
                  <Link href="/app/treasuries">
                    <Landmark className="size-6 mb-2" />
                    <span className="font-medium">US Treasuries</span>
                    <span className="text-xs opacity-90">Government Bonds</span>
                  </Link>
                </Button>
              </div>

              <Button
                asChild
                variant="outline"
                className="border-slate-200 text-foreground hover:bg-slate-100 bg-transparent"
              >
                <Link href="/app/portfolio">View Portfolio</Link>
              </Button>
            </GlassCard>
          </FadeIn>
        )}
      </div>
    </div>
  )
}
