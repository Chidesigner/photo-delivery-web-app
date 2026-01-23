"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function AdminGuard({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push("/admin/login")
      } else {
        setChecking(false)
      }
    }

    checkAuth()
  }, [router])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Checking authentication…</p>
      </div>
    )
  }

  return <>{children}</>
}
