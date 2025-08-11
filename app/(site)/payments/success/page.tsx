"use client";
import { Suspense } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { GlassCard } from "@/components/glass-card";
import { FadeIn } from "@/components/motion";
import AuroraBg from "@/components/aurora-bg";
import { CheckCircle2, ArrowRight, Home } from "lucide-react";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get("session_id");
  const [sessionData, setSessionData] = useState<any>(null);

  useEffect(() => {
    if (sessionId) {
      setSessionData({ id: sessionId });
    }
  }, [sessionId]);

  return (
    <div className="min-h-dvh bg-white relative overflow-hidden">
      <Header />
      <main className="container px-4 md:px-6 py-10 md:py-16 relative">
        <AuroraBg intensity={0.5} />
        <div className="max-w-2xl mx-auto">
          <FadeIn>
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
                Payment Successful!
              </h1>
              <p className="text-muted-foreground mt-2">
                Thank you for your purchase. Your payment has been processed
                successfully.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.05}>
            <GlassCard>
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="text-green-800 font-medium">
                        Payment Confirmed
                      </p>
                      <p className="text-green-700 mt-1">
                        Your payment has been successfully processed and you now
                        have access to Circle Finance features.
                      </p>
                      {sessionId && (
                        <p className="text-green-600 mt-2 text-xs font-mono">
                          Session ID: {sessionId}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">What's Next?</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span>Access to Circle Finance payment features</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span>Explore tokenized real estate investments</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span>Start building your portfolio</span>
                    </li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    asChild
                    className="bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white hover:opacity-95"
                  >
                    <Link href="/explore">
                      Explore Estates
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="border-slate-200 hover:bg-slate-100"
                  >
                    <Link href="/">
                      <Home className="mr-2 w-4 h-4" />
                      Return Home
                    </Link>
                  </Button>
                </div>
              </div>
            </GlassCard>
          </FadeIn>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
