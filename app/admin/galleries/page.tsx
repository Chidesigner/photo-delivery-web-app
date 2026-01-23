"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "react-hot-toast"
import {
  EyeIcon,
  TrashIcon,
  PencilSquareIcon,
  ArrowUpOnSquareIcon,
  ClipboardIcon,
} from "@heroicons/react/24/outline"

type Gallery = {
  id: string
  event_name: string
  client_email: string
  paid: boolean
}

export default function AdminGalleriesPage() {
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [loading, setLoading] = useState(false)
  const [newEmail, setNewEmail] = useState("")
  const [newEvent, setNewEvent] = useState("")
  const [creating, setCreating] = useState(false)

  // Load galleries
  const loadGalleries = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("galleries")
      .select("*")
      .order("created_at", { ascending: false })
    if (data) setGalleries(data)
    setLoading(false)
  }

  useEffect(() => {
    loadGalleries()
  }, [])

  // Create gallery
  const createGallery = async () => {
    if (!newEmail || !newEvent) return toast.error("Fill all fields")
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) return toast.error("Invalid email")

    // Check duplicate
    const { data: existing } = await supabase
      .from("galleries")
      .select("id")
      .eq("client_email", newEmail)
      .single()
    if (existing) return toast.error("Gallery already exists for this email")

    setCreating(true)
    const { data, error } = await supabase
      .from("galleries")
      .insert({ client_email: newEmail, event_name: newEvent, paid: false })
      .select()
      .single()

    if (error || !data) {
      toast.error("Failed to create gallery")
      setCreating(false)
      return
    }

    toast.success("Gallery created!")
    setNewEmail("")
    setNewEvent("")
    setGalleries([data, ...galleries])
    setCreating(false)

    // Redirect to upload page automatically
    window.location.href = `/admin/upload/${data.id}`
  }

  // Delete gallery
  const deleteGallery = async (id: string) => {
    if (!confirm("Delete this gallery and all images?")) return
    await supabase.from("galleries").delete().eq("id", id)
    setGalleries(galleries.filter((g) => g.id !== id))
    toast.success("Gallery deleted")
  }

  // Toggle paid/unpaid
  const togglePaid = async (gallery: Gallery) => {
    await supabase
      .from("galleries")
      .update({ paid: !gallery.paid })
      .eq("id", gallery.id)
    setGalleries(
      galleries.map((g) =>
        g.id === gallery.id ? { ...g, paid: !g.paid } : g
      )
    )
  }

  // Copy link
  const copyLink = (id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/client/gallery/${id}`)
    toast.success("Link copied")
  }

  return (
    <div className="max-w-7xl mx-auto px-4 mt-8">
      <h1 className="text-3xl font-bold mb-6">Client Galleries</h1>

      {/* Create gallery */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <Input
          type="email"
          placeholder="Client email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          className="flex-1"
        />
        <Input
          type="text"
          placeholder="Event name"
          value={newEvent}
          onChange={(e) => setNewEvent(e.target.value)}
          className="flex-1"
        />
        <Button
          onClick={createGallery}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white flex-shrink-0"
          disabled={creating}
        >
          {creating ? "Creating…" : "Create Gallery"}
        </Button>
      </div>

      {/* Galleries grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {galleries.map((g) => (
          <div
            key={g.id}
            className="bg-card p-6 rounded-2xl shadow-md hover:shadow-xl transition-all relative group"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg truncate">{g.event_name}</h2>
              <span
                className={cn(
                  "px-2 py-1 text-xs font-medium rounded-full",
                  g.paid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                )}
              >
                {g.paid ? "Paid" : "Unpaid"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-4 truncate">
              {g.client_email}
            </p>

            {/* Action buttons */}
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() => window.location.href=`/client/gallery/${g.id}`}
                className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-800"
              >
                <EyeIcon className="w-4 h-4" /> View as Admin
              </Button>

              <Button
                onClick={() => window.location.href=`/admin/upload/${g.id}`}
                className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-800"
              >
                <ArrowUpOnSquareIcon className="w-4 h-4" /> Upload
              </Button>

              <Button
                onClick={() => togglePaid(g)}
                className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-800"
              >
                <PencilSquareIcon className="w-4 h-4" /> Toggle Paid
              </Button>

              <Button
                onClick={() => copyLink(g.id)}
                className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-800"
              >
                <ClipboardIcon className="w-4 h-4" /> Copy Link
              </Button>

              <Button
                onClick={() => deleteGallery(g.id)}
                className="flex items-center gap-1 bg-red-100 hover:bg-red-200 text-red-800 ml-auto"
              >
                <TrashIcon className="w-4 h-4" /> Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
