"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import { supabase } from "@/lib/supabase"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type Gallery = {
  event_name: string
  client_email: string
  paid: boolean
}

type PreviewFile = {
  file: File
  preview: string
}

export default function AdminGalleryUploadPage() {
  const { galleryId } = useParams<{ galleryId: string }>()

  const [gallery, setGallery] = useState<Gallery | null>(null)
  const [files, setFiles] = useState<PreviewFile[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

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

  // 🖼 Handle file selection
  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return

    const newFiles: PreviewFile[] = Array.from(fileList).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }))

    setFiles((prev) => [...prev, ...newFiles])
  }

  // 🗑 Remove selected file
  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  // 📤 Upload images
  const uploadImages = async () => {
    if (files.length === 0) {
      setMessage("Please select images to upload")
      return
    }

    setLoading(true)
    setMessage(null)

    for (const item of files) {
      const filePath = `${galleryId}/${Date.now()}-${item.file.name}`

      const { error } = await supabase.storage
        .from("Photo-Delivery-Storage")
        .upload(filePath, item.file)

      if (error) {
        setMessage("❌ Upload failed. Please try again.")
        setLoading(false)
        return
      }
    }

    setFiles([])
    setLoading(false)
    setMessage("✅ Photos uploaded successfully")
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-10">

      {/* 🌈 Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 via-primary to-purple-600 p-8 text-primary-foreground shadow-xl">
        <h1 className="text-3xl font-bold">Upload Photos</h1>
        {gallery && (
          <p className="mt-2 text-primary-foreground/80">
            <strong>{gallery.event_name}</strong> — {gallery.client_email}
          </p>
        )}
      </div>

      {/* 📤 Upload Area */}
      <div className="rounded-2xl border bg-card p-8 shadow-sm space-y-6">

        <h2 className="text-xl font-semibold">Add Images</h2>

        {/* Drag & Drop Zone */}
        <label
          className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center transition-all cursor-pointer
            ${
              dragActive
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/60"
            }`}
          onDragOver={(e) => {
            e.preventDefault()
            setDragActive(true)
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragActive(false)
            handleFiles(e.dataTransfer.files)
          }}
        >
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          <div className="text-muted-foreground">
            <p className="text-lg font-medium">
              Drag & drop images here
            </p>
            <p className="text-sm mt-1">
              or click to browse from your computer
            </p>
          </div>
        </label>

        {/* 🖼 Preview Grid */}
        {files.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground">
              Selected Photos ({files.length})
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {files.map((item, index) => (
                <div
                  key={index}
                  className="group relative overflow-hidden rounded-lg border bg-muted/30"
                >
                  <div className="relative h-40 w-full">
                    <Image
                      src={item.preview}
                      alt="Preview"
                      fill
                      className="object-cover transition-transform group-hover:scale-[1.03]"
                    />
                  </div>

                  <button
                    onClick={() => removeFile(index)}
                    className="absolute top-2 right-2 rounded-full bg-black/60 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Action */}
        <div className="flex items-center justify-between pt-4">
          {message && (
            <p className="text-sm text-muted-foreground">
              {message}
            </p>
          )}

          <Button onClick={uploadImages} disabled={loading}>
            {loading ? "Uploading…" : "Upload Photos"}
          </Button>
        </div>
      </div>
    </div>
  )
}
