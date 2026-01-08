"use client"

import Link from "next/link"

export default function AdminDashboard() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back 👋
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage client galleries and deliver photos professionally.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/admin/galleries"
          className="group rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1"
        >
          <h2 className="text-xl font-semibold flex items-center gap-2">
            📁 Client Galleries
          </h2>
          <p className="text-muted-foreground mt-2">
            Create, manage, and organize photo galleries for your clients.
          </p>
          <p className="mt-4 text-sm text-primary group-hover:underline">
            Open →
          </p>
        </Link>

        <div className="rounded-xl border bg-card p-6 opacity-60">
          <h2 className="text-xl font-semibold">
            🎨 Custom Branding
          </h2>
          <p className="text-muted-foreground mt-2">
            Coming soon — personalize your delivery experience.
          </p>
        </div>
      </div>
    </div>
  )
}
