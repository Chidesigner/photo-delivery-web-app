"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import toast from "react-hot-toast"
import Image from "next/image"

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      toast.success("Welcome back!", {
        style: {
          background: '#059669',
          color: '#fff',
          borderRadius: '12px',
        }
      })
      
      router.push("/admin")
    } catch (err: any) {
      toast.error(err.message || "Invalid credentials")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute top-20 right-20 w-96 h-96 bg-[#c67b5c]/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: '0s' }}
        />
        <div 
          className="absolute bottom-20 left-20 w-80 h-80 bg-[#8b9e87]/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: '1.5s' }}
        />
      </div>

      {/* Login card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white rounded-3xl border border-[#e7e5e4] shadow-xl p-8 md:p-12 animate-scale-in">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Image 
              src="/a2-logo.png" 
              alt="A2Studios" 
              width={80} 
              height={80}
              className="w-20 h-20"
            />
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-light text-[#1c1917] mb-2">Admin Login</h1>
            <p className="text-[#78716c]">Access your A2Studios dashboard</p>
          </div>

          {/* Login form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#1c1917] mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[#e7e5e4] focus:border-[#c67b5c] focus:ring-2 focus:ring-[#c67b5c]/20 outline-none transition-all"
                placeholder="admin@a2studios.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1c1917] mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[#e7e5e4] focus:border-[#c67b5c] focus:ring-2 focus:ring-[#c67b5c]/20 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3.5 bg-[#2d2a26] text-white rounded-xl hover:bg-[#3d3731] transition-all duration-300 hover:scale-105 font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Back to home */}
          <div className="mt-8 text-center">
            <button
              onClick={() => router.push("/")}
              className="text-sm text-[#78716c] hover:text-[#c67b5c] transition-colors"
            >
              ← Back to Home
            </button>
          </div>
        </div>

        {/* Security note */}
        <div className="mt-6 text-center">
          <p className="text-xs text-[#78716c]">
            <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Secure admin access only
          </p>
        </div>
      </div>
    </div>
  )
}