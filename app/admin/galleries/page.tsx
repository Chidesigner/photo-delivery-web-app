"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export default function AdminGalleriesPage() {
  const [eventName, setEventName] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [paid, setPaid] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [clientLink, setClientLink] = useState<string | null>(null)
  const [adminUploadLink, setAdminUploadLink] = useState<string | null>(null)

  const createGallery = async () => {
    if (!eventName || !clientEmail) {
      setError("All fields are required")
      return
    }

    setLoading(true)
    setError(null)
    setClientLink(null)
    setAdminUploadLink(null)

    const { data, error } = await supabase
      .from("galleries")
      .insert({
        event_name: eventName,
        client_email: clientEmail,
        paid,
      })
      .select()
      .single()

    if (error || !data) {
      setError("Failed to create gallery")
      setLoading(false)
      return
    }

    const origin = window.location.origin

    setClientLink(`${origin}/client/gallery/${data.id}`)
    setAdminUploadLink(`${origin}/admin/galleries/${data.id}/photos`)

    setEventName("")
    setClientEmail("")
    setPaid(false)
    setLoading(false)
  }

  return (
    <div className="max-w-xl mx-auto mt-16 px-4">
      <h1 className="text-3xl font-semibold mb-8">Create Gallery</h1>

      <div className="space-y-4">
        <div>
          <Label>Event name</Label>
          <Input
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            placeholder="Wedding, Birthday, Photoshoot…"
          />
        </div>

        <div>
          <Label>Client email</Label>
          <Input
            type="email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            placeholder="client@email.com"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={paid}
            onChange={(e) => setPaid(e.target.checked)}
          />
          <span>Paid</span>
        </div>

        {error && <p className="text-red-500">{error}</p>}

        <Button
          className="w-full"
          onClick={createGallery}
          disabled={loading}
        >
          {loading ? "Creating…" : "Create gallery"}
        </Button>
      </div>

      {(clientLink || adminUploadLink) && (
        <div className="mt-8 p-4 border rounded-lg space-y-4">
          {clientLink && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Client gallery link:
              </p>
              <a
                href={clientLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 hover:underline break-all"
              >
                {clientLink}
              </a>
            </div>
          )}

          {adminUploadLink && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Admin upload link:
              </p>
              <a
                href={adminUploadLink}
                className="text-blue-600 hover:text-blue-800 hover:underline break-all"
              >
                {adminUploadLink}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
