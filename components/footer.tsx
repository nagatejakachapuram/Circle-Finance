import Link from "next/link"
import { Twitter, BookOpen, Shield, Globe } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function Footer() {
  return (
    <footer className="mt-16">
      <div className="border-t border-slate-200/80 bg-white/70 backdrop-blur-xl">
        <div className="container px-4 md:px-6 py-10">
          {/* Top */}
          <div className="grid gap-6 md:grid-cols-4">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2">
                <div className="h-8 w-8 rounded-full ring-2 ring-slate-200/80 bg-[conic-gradient(from_180deg_at_50%_50%,#3A86FF_0%,#8ab6ff_40%,#3A86FF_100%)]" />
                <span className="font-semibold text-foreground">{"CircleX Finance"}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {"USDC-native platform for tokenized real estate investing. Fully on-chain and compliance-first."}
              </p>
              <div className="flex items-center gap-2">
                <Badge className="bg-[#3A86FF] text-white hover:bg-[#2f76e8]">{"USDC-Only"}</Badge>
                <Badge variant="outline" className="border-slate-300 text-muted-foreground">
                  {"ERC-3643"}
                </Badge>
                <Badge variant="outline" className="border-slate-300 text-muted-foreground">
                  {"CCTP V2"}
                </Badge>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-foreground">{"Company"}</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground underline-offset-4 hover:underline">
                    {"About"}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground underline-offset-4 hover:underline">
                    {"Careers"}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground underline-offset-4 hover:underline">
                    {"Contact"}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-foreground">{"Legal"}</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground underline-offset-4 hover:underline">
                    {"Terms"}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground underline-offset-4 hover:underline">
                    {"Privacy"}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground underline-offset-4 hover:underline">
                    {"Disclaimers"}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-foreground">{"Network Status"}</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Globe className="size-4 text-[#3A86FF]" />
                  {"Ethereum (USDC)"}
                </li>
                <li className="flex items-center gap-2">
                  <Globe className="size-4 text-[#3A86FF]" />
                  {"Base (USDC)"}
                </li>
                <li className="flex items-center gap-2">
                  <Globe className="size-4 text-[#3A86FF]" />
                  {"Polygon (USDC.e)"}
                </li>
                <li className="flex items-center gap-2">
                  <Globe className="size-4 text-[#3A86FF]" />
                  {"Solana (USDC)"}
                </li>
              </ul>
              <div className="mt-4 flex items-center gap-3">
                <Link aria-label="Docs" href="#" className="text-muted-foreground hover:text-foreground">
                  <BookOpen className="size-5" />
                </Link>
                <Link aria-label="Twitter" href="#" className="text-muted-foreground hover:text-foreground">
                  <Twitter className="size-5" />
                </Link>
                <Link aria-label="Compliance" href="#" className="text-muted-foreground hover:text-foreground">
                  <Shield className="size-5" />
                </Link>
              </div>
            </div>
          </div>
          {/* Bottom */}
        </div>
      </div>
    </footer>
  )
}
