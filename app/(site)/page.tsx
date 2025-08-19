import Link from "next/link"
import Image from "next/image"
import { ArrowRight, CheckCircle2, Shield, Wallet, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Suspense } from "react"
import Hero from "@/components/hero"
import Header from "@/components/header"
import Footer from "@/components/footer"
import Features from "@/components/features"
import Testimonials from "@/components/testimonials"
import FinalCta from "@/components/final-cta"
import { GlassCard } from "@/components/glass-card"
import { FadeIn } from "@/components/motion"

export default function Page() {
  return (
    <div className="min-h-dvh relative overflow-hidden bg-white">
      <Header />
      <main role="main" className="relative">
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10"
          style={{
            background:
              "radial-gradient(1200px 800px at 50% 0%, rgba(58,134,255,0.08), transparent 60%), radial-gradient(900px 600px at 100% 0%, rgba(58,134,255,0.12), transparent 60%), #ffffff",
          }}
        />
        <Suspense fallback={null}>
          <Hero />
        </Suspense>

        <Features />

        <section aria-labelledby="how-it-works" className="py-16 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 id="how-it-works" className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
                  {"How CircleX Finance Works"}
                </h2>
                <p className="text-muted-foreground mt-2 max-w-3xl">
                  {"Connect your wallet, complete fast KYC, invest in tokenized properties, and earn rent in USDC."}
                </p>
              </div>
              <Button asChild className="bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white hover:opacity-95">
                <Link href="/app">
                  {"View Steps"}
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Connect Wallet", desc: "Authenticate with your self-custodied wallet.", icon: Wallet },
                { title: "KYC & Onboard", desc: "Complete verification to unlock investments.", icon: Shield },
                { title: "Invest On-Chain", desc: "Buy compliant property tokens fully on-chain.", icon: Building2 },
                { title: "Earn in USDC", desc: "Receive rent distributions directly in USDC.", icon: CheckCircle2 },
              ].map((s, i) => (
                <FadeIn key={s.title} delay={i * 0.04}>
                  <GlassCard>
                    <s.icon className="size-6 text-[#3A86FF]" aria-hidden="true" />
                    <h3 className="mt-4 text-lg font-medium text-foreground">{s.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                  </GlassCard>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="explore" className="py-16 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 id="explore" className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
                  {"Explore Estates"}
                </h2>
                <p className="text-muted-foreground mt-2">
                  {"Browse verified, tokenized properties with transparent on-chain performance."}
                </p>
              </div>
              <Button asChild className="bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white hover:opacity-95">
                <Link href="/app">
                  {"Explore Estates"}
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { name: "SoMa Loft Fund", location: "San Francisco, USA", apy: 7.2, rent: "Monthly", price: 120.0 },
                { name: "Shoreline Residences", location: "Miami, USA", apy: 6.5, rent: "Monthly", price: 85.0 },
                { name: "Eixample Offices", location: "Barcelona, ES", apy: 8.1, rent: "Quarterly", price: 140.0 },
              ].map((prop, i) => (
                <FadeIn key={prop.name} delay={i * 0.04}>
                  <GlassCard className="p-0 overflow-hidden">
                    <div className="p-0">
                      <Image
                        src="/modern-building-dusk.png"
                        alt={`Property preview for ${prop.name}`}
                        width={640}
                        height={180}
                        className="w-full h-44 object-cover"
                      />
                      <div className="p-5">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium text-foreground">{prop.name}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{prop.location}</p>
                        <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                          <div className="rounded px-3 py-2 bg-white/70 border border-slate-200">
                            <p className="text-muted-foreground">{"APY"}</p>
                            <p className="font-medium text-foreground">{prop.apy}%</p>
                          </div>
                          <div className="rounded px-3 py-2 bg-white/70 border border-slate-200">
                            <p className="text-muted-foreground">{"Rent"}</p>
                            <p className="font-medium text-foreground">{prop.rent}</p>
                          </div>
                          <div className="rounded px-3 py-2 bg-white/70 border border-slate-200">
                            <p className="text-muted-foreground">{"Token"}</p>
                            <p className="font-medium text-foreground">${prop.price.toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="mt-5 flex items-center gap-3">
                          <Button
                            asChild
                            size="sm"
                            className="bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white hover:opacity-95"
                          >
                            <Link href="/app">{"Invest"}</Link>
                          </Button>
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="border-slate-200 text-foreground hover:bg-slate-100 bg-transparent"
                          >
                            <Link href="/explore">{"View Details"}</Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        <Testimonials />

        <FinalCta />
      </main>
      <Footer />
    </div>
  )
}
