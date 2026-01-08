"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Copy, Trash2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import clsx from "clsx"

type Gallery = {
  id: string
  event_name: string
  client_email: string
  paid: boolean
}

export default function GalleriesPage() {
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [loading, setLoading] = useState(false)

  // Form state
  const [eventName, setEventName] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [paid, setPaid] = useState(true)
  const [creating, setCreating] = useState(false)

  // Fetch galleries
  const fetchGalleries = async () => {
    setLoading(true)
    const { data } = await supabase.from("galleries").select("*")
    if (data) setGalleries(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchGalleries()
  }, [])

  // Create new gallery
  const createGallery = async () => {
  if (!eventName || !clientEmail) return alert("Please fill all fields")

  // simple email regex check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(clientEmail)) {
    return alert("Please enter a valid email address")
  }

  setCreating(true)

  const { data, error } = await supabase
    .from("galleries")
    .insert([{ event_name: eventName, client_email: clientEmail, paid }])
    .select()
    .single()

  if (error) {
    alert("Error creating gallery: " + error.message)
    setCreating(false)
    return
  }

  setGalleries((prev) => [data, ...prev])
  setEventName("")
  setClientEmail("")
  setPaid(true)
  setCreating(false)
}


  // Delete gallery
  const deleteGallery = async (id: string) => {
    if (!confirm("Delete this gallery? This cannot be undone.")) return
    await supabase.from("galleries").delete().eq("id", id)
    setGalleries((prev) => prev.filter((g) => g.id !== id))
  }

  // Copy link
  const copyLink = (id: string) => {
    const url = `${window.location.origin}/client/gallery/${id}`
    navigator.clipboard.writeText(url)
    alert("Client link copied!")
  }

  // Admin view gallery
  const viewGalleryAsAdmin = (id: string) => {
    window.location.href = `/client/gallery/${id}?admin=true`
  }

  return (
    <div className="space-y-8">
      {/* === Create Gallery Form === */}
      <div className="bg-card p-6 rounded-2xl shadow-md max-w-2xl mx-auto">
        <h2 className="text-xl font-bold mb-4">Create New Gallery</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            placeholder="Event Name"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
          />
          <Input
            type="email"
            placeholder="Client Email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
          />
          <select
            className="rounded-md border border-input px-3 py-2 bg-card text-card-foreground"
            value={paid ? "paid" : "unpaid"}
            onChange={(e) => setPaid(e.target.value === "paid")}
          >
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>
        <Button
        className="mt-6 w-full bg-black text-white font-semibold shadow-md rounded-lg hover:bg-gray-900 hover:scale-105 hover:shadow-lg transition-all duration-200"
        onClick={createGallery}
        disabled={creating}
      >
        {creating ? "Creating…" : "Create Gallery"}
      </Button>



      </div>

      {/* === Galleries Grid === */}
      {loading ? (
        <p className="text-muted-foreground text-center">Loading galleries…</p>
      ) : galleries.length === 0 ? (
        <p className="text-muted-foreground text-center">No galleries yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {galleries.map((g) => (
            <div
              key={g.id}
              className="bg-card rounded-2xl p-5 shadow-md hover:shadow-xl transition-shadow flex flex-col justify-between"
            >
              <div>
                <h2 className="text-lg font-semibold">{g.event_name}</h2>
                <p className="text-sm text-muted-foreground mt-1">{g.client_email}</p>
              </div>

              <div className="flex items-center justify-between mt-4">
                <span
                  className={clsx(
                    "px-3 py-1 rounded-full text-xs font-medium",
                    g.paid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  )}
                >
                  {g.paid ? "Paid" : "Unpaid"}
                </span>

                <div className="flex gap-2">
                  <Button
                    onClick={() => copyLink(g.id)}
                    className="p-2 bg-muted/20 hover:bg-muted/40 rounded-md transition"
                    title="Copy link"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>

                  <Button
                    onClick={() => viewGalleryAsAdmin(g.id)}
                    className="p-2 bg-primary/10 hover:bg-primary/20 rounded-md transition"
                    title="View gallery as admin"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>

                  <Button
                    onClick={() => deleteGallery(g.id)}
                    className="p-2 bg-red-100 hover:bg-red-200 rounded-md transition"
                    title="Delete gallery"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
