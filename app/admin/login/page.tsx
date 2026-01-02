"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const ADMIN_EMAIL = "astudios002@gmail.com"

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const signIn = async () => {
    if (!email || !password) {
      setError("Enter email and password")
      return
    }

    if (email !== ADMIN_EMAIL) {
      setError("Unauthorized")
      return
    }

    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError("Invalid credentials")
      setLoading(false)
      return
    }

    router.push("/admin")
  }

  return (
    <div className="max-w-md mx-auto mt-24">
      <h1 className="text-3xl font-semibold mb-6">Admin Login</h1>

      <Input
        type="email"
        placeholder="Admin email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <Input
        type="password"
        placeholder="Password"
        className="mt-4"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {error && <p className="text-red-500 mt-3">{error}</p>}

      <Button className="mt-6 w-full" onClick={signIn} disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </Button>
    </div>
  )
}
