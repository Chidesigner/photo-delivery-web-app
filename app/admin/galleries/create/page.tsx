"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";

export default function CreateGalleryPage() {
  const router = useRouter();

  const [eventName, setEventName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [eventDate, setEventDate] = useState(""); // ✅ NEW
  const [paid, setPaid] = useState(false);
  const [loading, setLoading] = useState(false);

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const createGallery = async () => {
    if (!eventName || !clientEmail) {
      toast.error("All fields are required");
      return;
    }

    if (!isValidEmail(clientEmail)) {
      toast.error("Invalid email address");
      return;
    }

    setLoading(true);

    try {
      // Prevent duplicate gallery for same client
      const { data: existing } = await supabase
        .from("galleries")
        .select("id")
        .eq("client_email", clientEmail)
        .single();

      if (existing) {
        toast.error("A gallery already exists for this email");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("galleries")
        .insert({
          event_name: eventName,
          client_email: clientEmail,
          paid,
          event_date: eventDate || null, // ✅ NEW
        })
        .select()
        .single();

      if (error || !data) throw error;

      toast.success("Gallery created successfully");
      router.push(`/admin/galleries/${data.id}/upload`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to create gallery");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="rounded-2xl border bg-card shadow-sm p-8 space-y-6">
        <h1 className="text-3xl font-bold">Create New Gallery</h1>
        <p className="text-muted-foreground">
          Add a client and prepare their private photo delivery space.
        </p>

        <div className="space-y-4">
          {/* Event Name */}
          <div>
            <Label>Event name</Label>
            <Input
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="Wedding, Birthday, Photoshoot..."
            />
          </div>

          {/* Event Date */}
          <div>
            <Label>Event date</Label>
            <Input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
          </div>

          {/* Client Email */}
          <div>
            <Label>Client email</Label>
            <Input
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="client@email.com"
            />
          </div>

          {/* Paid Checkbox */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={paid}
              onChange={(e) => setPaid(e.target.checked)}
              className="h-4 w-4"
            />
            <span className="text-sm">
              Mark as <strong>paid</strong>
            </span>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <Button onClick={createGallery} disabled={loading}>
              {loading ? "Creating…" : "Create Gallery"}
            </Button>
            <Button variant="secondary" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
