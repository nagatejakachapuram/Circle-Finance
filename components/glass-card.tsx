import { cn } from "@/lib/utils"

export function GlassCard({
  as: Component = "div",
  className = "",
  children,
  hover = true,
  padded = true,
}: {
  as?: any
  className?: string
  children?: React.ReactNode
  hover?: boolean
  padded?: boolean
}) {
  return (
    <Component
      className={cn(
        "relative rounded-2xl border border-slate-200/80 bg-white/70 backdrop-blur-xl",
        "shadow-[0_2px_10px_rgba(15,23,42,0.04),0_20px_40px_-24px_rgba(15,23,42,0.12)]",
        hover && "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_18px_rgba(15,23,42,0.06),0_30px_60px_-28px_rgba(15,23,42,0.16)]",
        "before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:p-[1px] before:[mask:linear-gradient(#fff,transparent)]",
        "before:bg-[linear-gradient(120deg,rgba(58,134,255,0.35),rgba(58,134,255,0.0),rgba(58,134,255,0.25))]",
        className
      )}
    >
      <div className={cn(padded && "p-6 md:p-8")}>{children}</div>
    </Component>
  )
}
