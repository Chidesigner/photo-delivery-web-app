"use client"

import { useEffect, useState } from "react"
import AdminGuard from "@/components/AdminGaurd"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

type Stats = {
  totalGalleries: number
  totalPhotos: number
  paidGalleries: number
  unpaidGalleries: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalGalleries: 0,
    totalPhotos: 0,
    paidGalleries: 0,
    unpaidGalleries: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)

      try {
        // Fetch galleries
        const { data: galleries, error: galleriesError } = await supabase
          .from("galleries")
          .select("id, paid")

        if (galleriesError) throw galleriesError

        // Fetch photos
        const { data: photos, error: photosError } = await supabase
          .from("photos")
          .select("id")

        if (photosError) throw photosError

        const totalGalleries = galleries?.length || 0
        const paidGalleries = galleries?.filter((g) => g.paid).length || 0
        const unpaidGalleries = totalGalleries - paidGalleries
        const totalPhotos = photos?.length || 0

        setStats({
          totalGalleries,
          totalPhotos,
          paidGalleries,
          unpaidGalleries,
        })
      } catch (err) {
        console.error("Failed to load dashboard stats", err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <AdminGuard>
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back 👋
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage client galleries and deliver photos professionally.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="rounded-xl border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">Total Galleries</p>
            <p className="text-3xl font-bold mt-2">
              {loading ? "—" : stats.totalGalleries}
            </p>
          </div>

          <div className="rounded-xl border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">Total Photos</p>
            <p className="text-3xl font-bold mt-2">
              {loading ? "—" : stats.totalPhotos}
            </p>
          </div>

          <div className="rounded-xl border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">Paid Galleries</p>
            <p className="text-3xl font-bold mt-2 text-green-600">
              {loading ? "—" : stats.paidGalleries}
            </p>
          </div>

          <div className="rounded-xl border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">Unpaid Galleries</p>
            <p className="text-3xl font-bold mt-2 text-red-500">
              {loading ? "—" : stats.unpaidGalleries}
            </p>
          </div>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/admin/galleries"
            className="group rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1"
          >
            <h2 className="text-xl font-semibold flex items-center gap-2">
              📁 Client Galleries
            </h2>
            <p className="text-muted-foreground mt-2">
              Create, manage, upload, and organize photo galleries for your
              clients.
            </p>
            <p className="mt-4 text-sm text-primary group-hover:underline">
              Open →
            </p>
          </Link>

          <Link
            href="/admin/galleries/create"   // ← updated link
            className="group rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1"
          >
            <h2 className="text-xl font-semibold flex items-center gap-2">
              ➕ Create New Gallery
            </h2>
            <p className="text-muted-foreground mt-2">
              Set up a new private gallery for a client in seconds.
            </p>
            <p className="mt-4 text-sm text-primary group-hover:underline">
              Create →
            </p>
          </Link>

        </div>
      </div>
    </AdminGuard>
  )
}
