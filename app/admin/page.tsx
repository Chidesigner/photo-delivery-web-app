"use client"

import Link from "next/link"
import { supabase } from "@/lib/supabase"

import { Button } from "@/components/ui/button"

export default function AdminDashboard() {
  const logout = async () => {
    await supabase.auth.signOut()
    window.location.href = "/admin/login"
  }

  return (
    <div className="max-w-5xl mx-auto mt-16 px-4">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
        <Button variant="outline" onClick={logout}>
          Logout
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/admin/galleries"
          className="border rounded-lg p-6 hover:shadow transition"
        >
          <h2 className="text-xl font-semibold">📁 Galleries</h2>
          <p className="text-muted-foreground mt-2">
            Create and manage client galleries
          </p>
        </Link>

        <div className="border rounded-lg p-6 opacity-50">
          <h2 className="text-xl font-semibold">💰 Payments</h2>
          <p className="text-muted-foreground mt-2">
            Coming soon
          </p>
        </div>

        <div className="border rounded-lg p-6 opacity-50">
          <h2 className="text-xl font-semibold">📊 Analytics</h2>
          <p className="text-muted-foreground mt-2">
            Monthly income tracking
          </p>
        </div>
      </div>
    </div>
  )
}
