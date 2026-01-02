"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

export default function AdminDashboardPage() {
  const [darkMode, setDarkMode] = useState(false)

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    if (!darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-50 transition-colors">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <span>Dark Mode</span>
            <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/admin/galleries" className="block">
            <Button className="w-full py-6 text-lg font-medium">
              Create Gallery
            </Button>
          </Link>

          <Link href="/admin/galleries/upload" className="block">
            <Button className="w-full py-6 text-lg font-medium">
              Upload Images
            </Button>
          </Link>

          <Link href="/admin/galleries/view" className="block">
            <Button className="w-full py-6 text-lg font-medium">
              View Galleries
            </Button>
          </Link>
        </div>

        {/* Optional Info / Footer */}
        <p className="mt-12 text-center text-sm text-muted-foreground">
          This dashboard is for managing client galleries only.
        </p>
      </div>
    </div>
  )
}
