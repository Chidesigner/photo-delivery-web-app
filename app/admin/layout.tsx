"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, LayoutDashboard, Images, Camera } from "lucide-react" // ← Added Camera
import clsx from "clsx"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mobileMenuOpen])

  // ✅ UPDATED: Added Portfolio
  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/galleries", label: "Client Galleries", icon: Images },
    { href: "/admin/portfolio", label: "Portfolio", icon: Camera }, // ← NEW
  ]

  const navItem = (href: string, label: string, Icon: any, isMobile = false) => {
    const isActive = pathname === href

    return (
      <Link
        href={href}
        onClick={() => setMobileMenuOpen(false)}
        className={clsx(
          "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300",
          isMobile && "py-4",
          isActive
            ? "bg-gradient-to-br from-[#c67b5c] to-[#8b9e87] text-white shadow-lg"
            : "text-[#78716c] hover:bg-[#fafaf9] hover:text-[#1c1917]"
        )}
      >
        <Icon className={clsx(
          "w-5 h-5 transition-transform duration-300",
          isActive ? "scale-110" : "group-hover:scale-110"
        )} />
        <span>{label}</span>
        {isActive && (
          <div className="ml-auto w-2 h-2 rounded-full bg-white" />
        )}
      </Link>
    )
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar for desktop */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:border-r md:border-[#e7e5e4] md:bg-white md:p-6 md:sticky md:top-0 md:h-screen">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-[#1c1917] mb-1">A2Studios</h2>
          <p className="text-xs text-[#78716c]">Admin Panel</p>
        </div>
        <nav className="flex flex-col space-y-2">
          {navItems.map((item) => (
            <div key={item.href}>
              {navItem(item.href, item.label, item.icon)}
            </div>
          ))}
        </nav>

        {/* Desktop Branding */}
        <div className="mt-auto pt-6 border-t border-[#e7e5e4]">
          <p className="text-xs text-[#78716c] text-center">
            Powered by A2Studios
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top nav for mobile */}
        <header className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b border-[#e7e5e4] bg-white/95 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-[#1c1917]">A2Studios</h1>
            <span className="px-2 py-1 text-xs font-medium text-[#c67b5c] bg-[#c67b5c]/10 rounded-md">
              Admin
            </span>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="relative p-2 rounded-xl hover:bg-[#fafaf9] transition-all duration-300 active:scale-95"
            aria-label="Toggle menu"
          >
            <div className="relative w-6 h-6">
              <Menu
                className={clsx(
                  "absolute inset-0 w-6 h-6 text-[#1c1917] transition-all duration-300",
                  mobileMenuOpen ? "opacity-0 rotate-90 scale-0" : "opacity-100 rotate-0 scale-100"
                )}
              />
              <X
                className={clsx(
                  "absolute inset-0 w-6 h-6 text-[#1c1917] transition-all duration-300",
                  mobileMenuOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0"
                )}
              />
            </div>
          </button>
        </header>

        {/* Mobile Menu Overlay - Elegant Full Screen */}
        <div
          className={clsx(
            "md:hidden fixed inset-0 z-50 transition-all duration-500",
            mobileMenuOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          )}
        >
          {/* Backdrop with blur */}
          <div
            className={clsx(
              "absolute inset-0 bg-[#1c1917]/60 backdrop-blur-md transition-opacity duration-500",
              mobileMenuOpen ? "opacity-100" : "opacity-0"
            )}
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Menu Panel - Slide from right */}
          <div
            className={clsx(
              "absolute top-0 right-0 h-full w-[85%] max-w-sm bg-white shadow-2xl transition-transform duration-500 ease-out",
              mobileMenuOpen ? "translate-x-0" : "translate-x-full"
            )}
          >
            {/* Menu Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#e7e5e4]">
              <div>
                <h2 className="text-xl font-semibold text-[#1c1917]">Navigation</h2>
                <p className="text-xs text-[#78716c] mt-1">Admin Panel</p>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-xl hover:bg-[#fafaf9] transition-all duration-300 active:scale-95"
                aria-label="Close menu"
              >
                <X className="w-6 h-6 text-[#1c1917]" />
              </button>
            </div>

            {/* Menu Items */}
            <nav className="flex flex-col p-6 space-y-2">
              {navItems.map((item, index) => (
                <div
                  key={item.href}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {navItem(item.href, item.label, item.icon, true)}
                </div>
              ))}
            </nav>

            {/* Mobile Menu Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-[#e7e5e4]">
              <div className="flex items-center justify-center gap-2 text-xs text-[#78716c]">
                <div className="w-2 h-2 rounded-full bg-gradient-to-br from-[#c67b5c] to-[#8b9e87]" />
                <span>Powered by A2Studios</span>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}