"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import clsx from "clsx"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItem = (href: string, label: string) => (
    <Link
      href={href}
      onClick={() => setMobileMenuOpen(false)}
      className={clsx(
        "block rounded-lg px-4 py-2 text-sm font-medium transition",
        pathname === href
          ? "bg-primary/10 text-primary font-semibold"
          : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
      )}
    >
      {label}
    </Link>
  )

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar for desktop */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:border-r md:bg-card md:p-6">
        <h2 className="text-lg font-semibold mb-6">Admin Panel</h2>
        <nav className="flex flex-col space-y-2">
          {navItem("/admin", "Dashboard")}
          {navItem("/admin/galleries", "Galleries")}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top nav for mobile */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b bg-card">
          <h1 className="text-lg font-semibold">Admin</h1>
          <div className="relative">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md hover:bg-muted/30 transition"
            >
              <Menu className="w-5 h-5" />
            </button>

            {mobileMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-card border rounded-lg shadow-lg z-50">
                <nav className="flex flex-col p-2 space-y-1">
                  {navItem("/admin", "Dashboard")}
                  {navItem("/admin/galleries", "Galleries")}
                </nav>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 md:pt-6">{children}</main>
      </div>
    </div>
  )
}
