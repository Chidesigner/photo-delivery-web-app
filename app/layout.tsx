import "./globals.css"

export const metadata = {
  title: "Photo Delivery App",
  description: "Professional client photo delivery system",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground min-h-screen">
        {children}
      </body>
    </html>
  )
}
