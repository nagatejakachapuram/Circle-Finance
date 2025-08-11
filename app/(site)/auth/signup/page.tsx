"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { Eye, EyeOff, Loader2, Mail, Lock, User } from 'lucide-react'
import Header from "@/components/header"
import Footer from "@/components/footer"
import { GlassCard } from "@/components/glass-card"
import { FadeIn } from "@/components/motion"
import AuroraBg from "@/components/aurora-bg"

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
      }
    } catch (err: any) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-dvh bg-white relative overflow-hidden">
        <Header />
        <main className="container px-4 md:px-6 py-10 md:py-16 relative">
          <AuroraBg intensity={0.5} />
          
          <div className="max-w-md mx-auto">
            <FadeIn>
              <GlassCard>
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <User className="w-8 h-8 text-green-600" />
                  </div>
                  <h1 className="text-2xl font-semibold text-foreground">
                    Account Created!
                  </h1>
                  <p className="text-muted-foreground">
                    Your Circle Pay account has been created successfully. You can now sign in and start exploring tokenized real estate investments.
                  </p>
                  <Button asChild className="w-full bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white hover:opacity-95">
                    <Link href="/auth/login">
                      Sign In to Your Account
                    </Link>
                  </Button>
                </div>
              </GlassCard>
            </FadeIn>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-white relative overflow-hidden">
      <Header />
      <main className="container px-4 md:px-6 py-10 md:py-16 relative">
        <AuroraBg intensity={0.5} />
        
        <div className="max-w-md mx-auto">
          <FadeIn>
            <div className="text-center mb-8">
              <div className="h-12 w-12 rounded-full ring-2 ring-slate-200/80 bg-[conic-gradient(from_180deg_at_50%_50%,#3A86FF_0%,#8ab6ff_40%,#3A86FF_100%)] mx-auto mb-4" />
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                Create Account
              </h1>
              <p className="text-muted-foreground mt-2">
                Join Circle Pay and start investing in tokenized real estate
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.05}>
            <GlassCard>
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="pl-10 bg-white border-slate-200"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a password"
                      className="pl-10 pr-10 bg-white border-slate-200"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Must be at least 6 characters long
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className="pl-10 pr-10 bg-white border-slate-200"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading || !email || !password || !confirmPassword}
                  className="w-full bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white hover:opacity-95"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link href="/auth/login" className="text-[#3A86FF] hover:underline font-medium">
                      Sign in
                    </Link>
                  </p>
                </div>
              </form>
            </GlassCard>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="mt-6 text-center">
              <Badge variant="outline" className="border-slate-300 text-muted-foreground">
                Secure Registration
              </Badge>
            </div>
          </FadeIn>
        </div>
      </main>
      <Footer />
    </div>
  )
}