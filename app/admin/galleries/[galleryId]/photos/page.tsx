"use client"

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

export default function AdminGalleryUploadPage() {
  const { galleryId } = useParams<{ galleryId: string }>()

  const [gallery, setGallery] = useState<Gallery | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  // 📄 Load gallery info
  useEffect(() => {
    const loadGallery = async () => {
      const { data, error } = await supabase
        .from("galleries")
        .select("event_name, client_email, paid")
        .eq("id", galleryId)
        .single()

      if (!error && data) {
        setGallery(data)
      }
    }

    loadGallery()
  }, [galleryId])

  // 📤 Upload images
  const uploadImages = async () => {
    if (files.length === 0) {
      setMessage("Please select images to upload")
      return
    }

    setLoading(true)
    setMessage(null)

    for (const file of files) {
      const filePath = `${galleryId}/${Date.now()}-${file.name}`

      const { error } = await supabase.storage
        .from("Photo-Delivery-Storage")
        .upload(filePath, file)

      if (error) {
        setMessage("Upload failed")
        setLoading(false)
        return
      }
    }

    setFiles([])
    setLoading(false)
    setMessage("✅ Upload successful")
  }

  return (
    <div className="max-w-3xl mx-auto mt-16 px-4">
      <h1 className="text-3xl font-semibold">Upload Photos</h1>

      {gallery && (
        <p className="text-muted-foreground mt-2">
          <strong>{gallery.event_name}</strong> — {gallery.client_email}
        </p>
      )}

      <div className="mt-8 space-y-4">
        <Input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => {
            if (e.target.files) {
              setFiles(Array.from(e.target.files))
            }
          }}
        />

        <Button onClick={uploadImages} disabled={loading}>
          {loading ? "Uploading..." : "Upload photos"}
        </Button>

        {message && (
          <p className="text-sm mt-2 text-muted-foreground">{message}</p>
        )}
      </div>
    </div>
  )
}
