"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function ClientGalleryAccessPage() {
  const { galleryId } = useParams<{ galleryId: string }>();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAccess = async () => {
    if (!email) return toast.error("Please enter your email");

    setLoading(true);

    try {
      // Query gallery by ID AND client email
      const { data, error } = await supabase
        .from("galleries")
        .select("id, event_name, paid, event_date") // removed 'description'
        .eq("id", galleryId)
        .eq("client_email", email)
        .maybeSingle();

      if (error) {
        console.error("Gallery access error:", error);
        throw new Error("Unable to fetch gallery");
      }

      if (!data) {
        toast.error("No gallery found for this email");
        setLoading(false);
        return;
      }

      // Success → go to gallery view page
      router.push(`/client/gallery/${galleryId}/view`);
    } catch (err: any) {
      console.error("Gallery access error:", err);
      toast.error(err.message || "Failed to access gallery");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50">
      <div className="max-w-md w-full p-8 rounded-2xl bg-white shadow-lg text-center">
        <h1 className="text-2xl font-bold mb-6">Enter your email to access gallery</h1>
        <input
          type="email"
          placeholder="Your email"
          className="w-full px-4 py-3 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button onClick={handleAccess} className="w-full" disabled={loading}>
          {loading ? "Checking..." : "Access Gallery"}
        </Button>
      </div>
    </div>
  );
}
