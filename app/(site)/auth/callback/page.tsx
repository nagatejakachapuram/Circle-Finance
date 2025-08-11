"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from 'lucide-react'
import Header from "@/components/header"
import Footer from "@/components/footer"
import { GlassCard } from "@/components/glass-card"
import AuroraBg from "@/components/aurora-bg"

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const supabase = createClient()
        const { error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          router.push('/auth/login?error=callback_error')
        } else {
          router.push('/')
        }
      } catch (err) {
        console.error('Unexpected error during auth callback:', err)
        router.push('/auth/login?error=unexpected_error')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-dvh bg-white relative overflow-hidden">
      <Header />
      <main className="container px-4 md:px-6 py-10 md:py-16 relative">
        <AuroraBg intensity={0.5} />
        
        <div className="max-w-md mx-auto">
          <GlassCard>
            <div className="text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-[#3A86FF] mx-auto" />
              <h1 className="text-xl font-semibold text-foreground">
                Completing Sign In...
              </h1>
              <p className="text-muted-foreground text-sm">
                Please wait while we complete your authentication.
              </p>
            </div>
          </GlassCard>
        </div>
      </main>
      <Footer />
    </div>
  )
}