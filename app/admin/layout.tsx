"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

const ADMIN_EMAIL = "astudios002@gmail.com"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // ✅ Allow login page without auth check
    if (pathname === "/admin/login") return

    const checkAdmin = async () => {
      const { data } = await supabase.auth.getUser()

      if (!data.user || data.user.email !== ADMIN_EMAIL) {
        router.replace("/admin/login")
      }
    }

    checkAdmin()
  }, [pathname, router])

  return <>{children}</>
}
