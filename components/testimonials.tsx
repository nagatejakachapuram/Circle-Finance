"use client"

import { FadeIn } from "./motion"
import { GlassCard } from "./glass-card"

const testimonials = [
  {
    quote:
      "Circle Pay sets the standard for compliant tokenization. Our investors love the clarity and USDC distributions.",
    author: "Alex M.",
    role: "Fund Manager",
    initials: "AM",
  },
  {
    quote:
      "The on-chain records are a dream for audits. We shipped a product that looks premium and works reliably.",
    author: "Priya K.",
    role: "Product Lead",
    initials: "PK",
  },
  {
    quote:
      "Connecting investors to real estate on-chain with KYC controls is exactly what our compliance team needed.",
    author: "Diego R.",
    role: "Compliance Officer",
    initials: "DR",
  },
]

export default function Testimonials() {
  return (
    <section aria-labelledby="testimonials" className="py-16 md:py-24">
      <div className="container px-4 md:px-6">
        <FadeIn>
          <h2 id="testimonials" className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
            {"What teams are saying"}
          </h2>
        </FadeIn>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <FadeIn key={t.author} delay={i * 0.05}>
              <GlassCard>
                <p className="text-foreground/90">{"“"}{t.quote}{"”"}</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="relative inline-grid place-items-center h-9 w-9 rounded-full text-sm font-medium text-foreground">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#3A86FF] to-[#8ab6ff] opacity-40 blur-sm" />
                    <div className="relative inline-grid place-items-center h-9 w-9 rounded-full bg-white ring-1 ring-slate-200">
                      {t.initials}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{t.author}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </GlassCard>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
