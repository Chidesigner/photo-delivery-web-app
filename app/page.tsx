"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()

  return (
    <main className="flex flex-col md:flex-row min-h-screen items-center justify-center bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/20 text-foreground px-6 md:px-12">
      
      {/* Left side - Info */}
      <div className="max-w-xl space-y-6 md:mr-12 text-center md:text-left animate-fade-in">
        <h1 className="text-5xl md:text-6xl font-extrabold leading-tight tracking-tight text-primary">
          Photo Delivery App
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl">
          Manage client galleries seamlessly, upload photos securely, and deliver an experience your clients will love.
        </p>

        <Button
          className="btn text-lg py-3 px-8 mt-4 shadow-lg hover:shadow-xl transition-transform duration-300 transform hover:-translate-y-1"
          onClick={() => router.push("/admin")}
        >
          Go to Dashboard
        </Button>

      </div>
    </main>
  )
}
