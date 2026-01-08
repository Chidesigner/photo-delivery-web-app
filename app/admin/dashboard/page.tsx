"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

const actions = [
  {
    title: "Create Gallery",
    description: "Set up a new private gallery for a client",
    href: "/admin/galleries",
  },
  {
    title: "Upload Images",
    description: "Upload and manage photos for existing galleries",
    href: "/admin/galleries/upload",
  },
  {
    title: "View Galleries",
    description: "Browse, edit, and manage all client galleries",
    href: "/admin/galleries/view",
  },
]

export default function AdminDashboardPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Admin Dashboard
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage client galleries, uploads, and access from one place.
        </p>
      </div>

      {/* Actions */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className="group rounded-xl border bg-card p-6 transition hover:shadow-md"
          >
            <div className="space-y-2">
              <h2 className="text-lg font-medium">
                {action.title}
              </h2>
              <p className="text-sm text-muted-foreground">
                {action.description}
              </p>
            </div>

            <div className="mt-6">
              <Button variant="secondary" className="w-full">
                Open
              </Button>
            </div>
          </Link>
        ))}
      </div>

      {/* Footer */}
      <div className="pt-6 text-center text-sm text-muted-foreground">
        This admin area is restricted to authorized users only.
      </div>
    </div>
  )
}
