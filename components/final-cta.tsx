import Link from "next/link"
import { Button } from "@/components/ui/button"
import { GlassCard } from "./glass-card"
import { FadeIn } from "./motion"

export default function FinalCta() {
  return (
    <section aria-label="Final call to action" className="py-16 md:py-24">
      <div className="container px-4 md:px-6">
        <FadeIn>
          <GlassCard>
            <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
                  {"Ready to invest in tokenized real estate?"}
                </h2>
                <p className="text-muted-foreground mt-2">
                  {"Connect your wallet and complete KYC to start exploring estates."}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild className="bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white shadow-[0_10px_30px_-10px_rgba(58,134,255,0.45)] hover:opacity-95">
                  <Link href="/get-started">{"Start KYC"}</Link>
                </Button>
                <Button asChild variant="outline" className="border-slate-200 text-foreground hover:bg-slate-100">
                  <Link href="/explore">{"Explore Estates"}</Link>
                </Button>
              </div>
            </div>
          </GlassCard>
        </FadeIn>
      </div>
    </section>
  )
}
