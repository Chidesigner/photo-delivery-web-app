import "./globals.css"
import { Toaster } from "react-hot-toast"

export const metadata = {
  title: "A2 Studios Photo Delivery",
  description: "Professional client photo delivery system",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground min-h-screen">
        {children}
        {/* Toast notifications for copy link, payment status, delete, etc. */}
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
