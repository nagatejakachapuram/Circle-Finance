"use client"

import { FadeIn } from "./motion"
import { GlassCard } from "./glass-card"
import { ShieldCheck, Gauge, CircuitBoard, Coins } from 'lucide-react'

const items = [
  {
    title: "Compliance-First",
    desc: "ERC‑3643 powered access control and KYC gating ensure compliant participation.",
    icon: ShieldCheck,
  },
  {
    title: "USDC-Native",
    desc: "Stable, fast settlements and distributions via Circle CCTP V2 on supported chains.",
    icon: Coins,
  },
  {
    title: "Institutional UX",
    desc: "Glassmorphic UI, clear disclosures, and audit-ready on-chain records.",
    icon: Gauge,
  },
  {
    title: "Programmable Finance",
    desc: "Tokenized cashflows with transparent, automated rent distribution.",
    icon: CircuitBoard,
  },
]

export default function Features() {
  return (
    <section aria-labelledby="features" className="py-16 md:py-24">
      <div className="container px-4 md:px-6">
        <FadeIn>
          <h2 id="features" className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
            {"Why CircleX Finance"}
          </h2>
        </FadeIn>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((f, i) => (
            <FadeIn key={f.title} delay={i * 0.04}>
              <GlassCard>
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200">
                    <f.icon className="size-5 text-[#3A86FF]" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground">{f.title}</h3>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{f.desc}</p>
              </GlassCard>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
