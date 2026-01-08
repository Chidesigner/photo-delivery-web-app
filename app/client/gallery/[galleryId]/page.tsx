"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type Gallery = {
  event_name: string
  client_email: string
  paid: boolean
}

type GalleryImage = {
  name: string
  url: string
}

export default function GalleryPage() {
  const { galleryId } = useParams<{ galleryId: string }>()
  const searchParams = useSearchParams()
  const isAdminView = searchParams.get("admin") === "true"

  const [email, setEmail] = useState("")
  const [gallery, setGallery] = useState<Gallery | null>(null)
  const [images, setImages] = useState<GalleryImage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [imagesLoading, setImagesLoading] = useState(false)

  // 🔐 Check client or admin access
  const checkAccess = async () => {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from("galleries")
      .select("event_name, client_email, paid")
      .eq("id", galleryId)
      .single()

    if (error || !data) {
      setError("Gallery not found")
      setLoading(false)
      return
    }

    // 🔓 Admin bypass (only if logged in AND coming with ?admin=true)
    if (isAdminView) {
      const { data: authData } = await supabase.auth.getUser()
      const isAdmin = authData.user?.email === "astudios002@gmail.com"

      if (!isAdmin) {
        setError("Unauthorized admin access.")
        setLoading(false)
        return
      }

      setGallery(data)
      setLoading(false)
      return
    }

    // 👤 Client access
    if (!email) {
      setError("Please enter your email")
      setLoading(false)
      return
    }

    if (data.client_email !== email) {
      setError("Email does not match our records")
      setLoading(false)
      return
    }

    if (!data.paid) {
      setError("Gallery locked — payment required")
      setLoading(false)
      return
    }

    setGallery(data)
    setLoading(false)
  }

  // 📸 Load images
  useEffect(() => {
    if (!gallery) return

    const loadImages = async () => {
      setImagesLoading(true)
      const { data, error } = await supabase.storage
        .from("Photo-Delivery-Storage")
        .list(galleryId, { limit: 100, sortBy: { column: "name", order: "asc" } })

      if (!error && data) {
        const formatted: GalleryImage[] = data.map((file) => ({
          name: file.name,
          url: supabase.storage
            .from("Photo-Delivery-Storage")
            .getPublicUrl(`${galleryId}/${file.name}`).data.publicUrl,
        }))
        setImages(formatted)
      }

      setImagesLoading(false)
    }

    loadImages()
  }, [gallery, galleryId])

  // 🔐 Client Access UI
  if (!gallery && !isAdminView) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted px-4">
        <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-xl">
          <h1 className="text-2xl font-bold tracking-tight mb-2 text-center">
            Access Your Gallery
          </h1>

          <p className="text-sm text-muted-foreground text-center mb-6">
            Enter the email you used when booking to view your photos.
          </p>

          <div className="space-y-4">
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            {error && (
              <p className="text-sm text-red-500 text-center">
                {error}
              </p>
            )}

            <Button
              className="w-full"
              onClick={checkAccess}
              disabled={loading}
            >
              {loading ? "Checking…" : "View Gallery"}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // 🖼️ Gallery View
  return (
    <div className="max-w-6xl mx-auto mt-12 px-4">
      <h1 className="text-4xl font-bold">Welcome 👋</h1>
      <p className="text-muted-foreground mt-2 text-lg">
        Your photos from <strong>{gallery?.event_name}</strong>
      </p>

      <div className="mt-10">
        {imagesLoading && (
          <p className="text-muted-foreground text-center">Loading photos…</p>
        )}

        {!imagesLoading && images.length === 0 && (
          <div className="border border-dashed rounded-2xl p-16 text-center text-muted-foreground text-xl">
            📸 No photos uploaded yet
          </div>
        )}

        {!imagesLoading && images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {images.map((img) => (
              <div
                key={img.name}
                className="relative w-full h-60 overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 group"
              >
                <Image
                  src={img.url}
                  alt={img.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
