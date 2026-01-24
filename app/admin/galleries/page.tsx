"use client"

import AdminGuard from "@/components/AdminGaurd"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Switch from "@/components/ui/switch"
import {
  PencilSquareIcon,
  TrashIcon,
  PlusIcon,
  EyeIcon,
  ClipboardIcon,
} from "@heroicons/react/24/outline"

interface Gallery {
  id: string
  event_name: string
  client_email: string
  paid: boolean
}

export default function AdminGalleriesPage() {
  const router = useRouter()
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [emailInput, setEmailInput] = useState("")

  /** Build client gallery URL */
  const getClientGalleryUrl = (id: string) => {
    if (typeof window === "undefined") return ""
    return `${window.location.origin}/client/gallery/${id}`
  }

  /** Copy gallery link */
  const copyGalleryLink = async (id: string) => {
    try {
      await navigator.clipboard.writeText(getClientGalleryUrl(id))
      toast.success("Client link copied")
    } catch {
      toast.error("Failed to copy link")
    }
  }

  /** Fetch galleries */
  const fetchGalleries = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("galleries")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      toast.error("Failed to load galleries")
      console.error(error)
    } else {
      setGalleries(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchGalleries()
  }, [])

  /** Toggle paid status */
  const togglePaid = async (id: string, value: boolean) => {
    const { error } = await supabase
      .from("galleries")
      .update({ paid: value })
      .eq("id", id)

    if (error) {
      toast.error("Failed to update status")
      return
    }

    setGalleries((prev) =>
      prev.map((g) => (g.id === id ? { ...g, paid: value } : g))
    )
    toast.success("Payment status updated")
  }

  /** Update email */
  const updateEmail = async (id: string) => {
    if (!emailInput || !emailInput.includes("@")) {
      toast.error("Enter a valid email")
      return
    }

    const normalizedEmail = emailInput.toLowerCase() // <-- normalize

    const { error } = await supabase
      .from("galleries")
      .update({ client_email: normalizedEmail })
      .eq("id", id)

    if (error) {
      toast.error("Failed to update email")
      return
    }

    setGalleries((prev) =>
      prev.map((g) => (g.id === id ? { ...g, client_email: normalizedEmail } : g))
    )
    setEditingId(null)
    toast.success("Email updated")
  }

  /** Delete gallery + all storage files */
  const deleteGallery = async (galleryId: string) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="font-medium">Delete this client gallery?</p>
          <p className="text-sm text-muted-foreground">
            This will permanently remove the gallery and all its photos.
          </p>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1 text-sm rounded-md border"
            >
              Cancel
            </button>

            <button
              onClick={async () => {
                toast.dismiss(t.id)

                try {
                  const { error } = await supabase
                    .from("galleries")
                    .delete()
                    .eq("id", galleryId)

                  if (error) throw error

                  toast.success("Client gallery deleted successfully")
                  fetchGalleries() // reload list
                } catch (err: any) {
                  toast.error(err.message || "Failed to delete gallery")
                }
              }}
              className="px-3 py-1 text-sm rounded-md bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      ),
      { duration: 6000 }
    )
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/admin/login")
  }

  return (
    <AdminGuard>
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Client Galleries</h1>

          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleLogout}>
              Logout
            </Button>

            <Button
              onClick={() => router.push("/admin/galleries/create")}
              className="flex items-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              New Gallery
            </Button>
          </div>
        </div>

        {/* Galleries */}
        {loading ? (
          <p className="text-muted-foreground text-center">Loading galleries…</p>
        ) : galleries.length === 0 ? (
          <p className="text-muted-foreground text-center">No galleries yet.</p>
        ) : (
          <div className="grid gap-6">
            {galleries.map((g) => (
              <div
                key={g.id}
                className="flex flex-col md:flex-row items-center md:justify-between gap-4 p-4 rounded-xl border bg-card shadow-sm"
              >
                {/* Info */}
                <div className="flex-1 space-y-1">
                  <h2 className="font-semibold text-lg">{g.event_name}</h2>

                  {editingId === g.id ? (
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="w-64"
                      />
                      <Button onClick={() => updateEmail(g.id)}>Save</Button>
                      <Button
                        variant="secondary"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">{g.client_email}</p>
                  )}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-4">
                  {/* Paid Switch */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Paid</span>
                    <Switch
                      checked={g.paid}
                      onCheckedChange={(value) => togglePaid(g.id, value)}
                      className="h-6 w-11"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {/* Copy Link */}
                    <button
                      onClick={() => copyGalleryLink(g.id)}
                      className="p-2 rounded-lg hover:bg-muted transition"
                      title="Copy client link"
                    >
                      <ClipboardIcon className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                    </button>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setEditingId(g.id)
                        setEmailInput(g.client_email)
                      }}
                    >
                      <PencilSquareIcon className="w-4 h-4 mr-1" />
                      Edit
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        router.push(`/admin/galleries/${g.id}/upload`)
                      }
                    >
                      <EyeIcon className="w-4 h-4 mr-1" />
                      View
                    </Button>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteGallery(g.id)}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminGuard>
  )
}
