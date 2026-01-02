"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
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

  const [email, setEmail] = useState("")
  const [gallery, setGallery] = useState<Gallery | null>(null)
  const [images, setImages] = useState<GalleryImage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [imagesLoading, setImagesLoading] = useState(false)

  // 🔐 Check client access
  const checkAccess = async () => {
    if (!email) {
      setError("Please enter your email")
      return
    }

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

  // 📸 Load images after access is granted
  useEffect(() => {
    if (!gallery) return

    const loadImages = async () => {
      setImagesLoading(true)

      const { data, error } = await supabase.storage
        .from("Photo-Delivery-Storage")
        .list(galleryId, {
          limit: 100,
          sortBy: { column: "name", order: "asc" },
        })

      if (!error && data) {
        const formatted: GalleryImage[] = data.map((file) => ({
          name: file.name,
          url:
            supabase.storage
              .from("Photo-Delivery-Storage")
              .getPublicUrl(`${galleryId}/${file.name}`).data.publicUrl,
        }))

        setImages(formatted)
      }

      setImagesLoading(false)
    }

    loadImages()
  }, [gallery, galleryId])

  // 🔐 Access gate UI
  if (!gallery) {
    return (
      <div className="max-w-md mx-auto mt-24 px-4">
        <h1 className="text-2xl font-semibold mb-4">Access gallery</h1>

        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {error && <p className="text-red-500 mt-2">{error}</p>}

        <Button
          className="mt-4 w-full"
          onClick={checkAccess}
          disabled={loading}
        >
          {loading ? "Checking…" : "View gallery"}
        </Button>
      </div>
    )
  }

  // ✅ Authorized gallery view
  return (
    <div className="max-w-6xl mx-auto mt-12 px-4">
      <h1 className="text-3xl font-semibold">Welcome 👋</h1>
      <p className="text-muted-foreground mt-2">
        Your photos from <strong>{gallery.event_name}</strong>
      </p>

      <div className="mt-10">
        {imagesLoading && (
          <p className="text-muted-foreground">Loading photos…</p>
        )}

        {!imagesLoading && images.length === 0 && (
          <div className="border rounded-lg p-12 text-center text-muted-foreground">
            📸 No photos uploaded yet
          </div>
        )}

        {!imagesLoading && images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((img) => (
              <div
                key={img.name}
                className="relative w-full h-60 overflow-hidden rounded-lg"
              >
                <Image
                  src={img.url}
                  alt="Gallery photo"
                  fill
                  className="object-cover hover:scale-[1.02] transition"
                  sizes="(max-width: 768px) 50vw,
                         (max-width: 1200px) 33vw,
                         25vw"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
