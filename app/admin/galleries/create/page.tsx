"use client";

import AdminGuard from "@/components/AdminGaurd";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import Image from "next/image";

export default function CreateGalleryPage() {
  const router = useRouter();

  const [eventName, setEventName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [paid, setPaid] = useState(false);
  const [loading, setLoading] = useState(false);

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const createGallery = async () => {
    if (!eventName || !clientEmail) {
      toast.error("Event name and client email are required");
      return;
    }

    if (!isValidEmail(clientEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      // Prevent duplicate gallery for same client
      const { data: existing } = await supabase
        .from("galleries")
        .select("id")
        .eq("client_email", clientEmail.toLowerCase().trim())
        .single();

      if (existing) {
        toast.error("A gallery already exists for this email", {
          style: {
            background: '#dc2626',
            color: '#fff',
            borderRadius: '12px',
          }
        });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("galleries")
        .insert({
          event_name: eventName,
          client_email: clientEmail.toLowerCase().trim(),
          paid,
          event_date: eventDate || null,
        })
        .select()
        .single();

      if (error || !data) throw error;

      toast.success("Gallery created successfully!", {
        style: {
          background: '#059669',
          color: '#fff',
          borderRadius: '12px',
        }
      });
      
      router.push(`/admin/galleries/${data.id}/upload`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to create gallery");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      createGallery();
    }
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-[#fafaf9]">
        {/* Header */}
        <div className="bg-white border-b border-[#e7e5e4]">
          <div className="max-w-3xl mx-auto px-6 md:px-12 py-8">
            <button
              onClick={() => router.push("/admin/galleries")}
              className="flex items-center gap-2 text-[#78716c] hover:text-[#c67b5c] transition-colors mb-6"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Galleries
            </button>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#c67b5c] to-[#8b9e87] flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-light text-[#1c1917]">Create New Gallery</h1>
                <p className="text-[#78716c] mt-1">Set up a private gallery for your client</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-3xl mx-auto px-6 md:px-12 py-12">
          <div className="bg-white rounded-2xl border border-[#e7e5e4] shadow-sm overflow-hidden">
            <div className="p-8 space-y-6">
              {/* Event Name */}
              <div>
                <label className="block text-sm font-medium text-[#1c1917] mb-2">
                  Event Name *
                </label>
                <input
                  type="text"
                  required
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-4 py-3 rounded-xl border border-[#e7e5e4] focus:border-[#c67b5c] focus:ring-2 focus:ring-[#c67b5c]/20 outline-none transition-all text-[#1c1917] placeholder:text-[#78716c]"
                  placeholder="Wedding, Birthday, Corporate Event..."
                  autoFocus
                />
              </div>

              {/* Client Email */}
              <div>
                <label className="block text-sm font-medium text-[#1c1917] mb-2">
                  Client Email *
                </label>
                <input
                  type="email"
                  required
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-4 py-3 rounded-xl border border-[#e7e5e4] focus:border-[#c67b5c] focus:ring-2 focus:ring-[#c67b5c]/20 outline-none transition-all text-[#1c1917] placeholder:text-[#78716c]"
                  placeholder="client@example.com"
                />
                <p className="text-xs text-[#78716c] mt-2">
                  Client will use this email to access their gallery
                </p>
              </div>

              {/* Event Date */}
              <div>
                <label className="block text-sm font-medium text-[#1c1917] mb-2">
                  Event Date (Optional)
                </label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-4 py-3 rounded-xl border border-[#e7e5e4] focus:border-[#c67b5c] focus:ring-2 focus:ring-[#c67b5c]/20 outline-none transition-all text-[#1c1917]"
                />
              </div>

              {/* Payment Status */}
              <div className="pt-2">
                <div className="flex items-center justify-between p-4 rounded-xl bg-[#fafaf9] border border-[#e7e5e4]">
                  <div>
                    <p className="text-sm font-medium text-[#1c1917] mb-1">Payment Status</p>
                    <p className="text-xs text-[#78716c]">
                      {paid ? 'Client can download photos' : 'Downloads will be locked until payment'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPaid(!paid)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      paid ? 'bg-[#059669]' : 'bg-[#e7e5e4]'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        paid ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Info Box */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#c67b5c]/10 to-[#8b9e87]/10 border border-[#c67b5c]/20">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-[#c67b5c] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-[#1c1917]">
                    <p className="font-medium mb-1">What happens next?</p>
                    <p className="text-[#78716c]">
                      After creating the gallery, you'll be taken to the upload page where you can add photos. 
                      Share the gallery link with your client so they can access their photos.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  onClick={createGallery}
                  disabled={loading}
                  className="flex-1 px-6 py-3.5 bg-[#2d2a26] text-white rounded-xl hover:bg-[#3d3731] transition-all duration-300 hover:scale-105 font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Creating Gallery...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Create Gallery
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => router.push("/admin/galleries")}
                  className="px-6 py-3.5 bg-white border-2 border-[#e7e5e4] text-[#2d2a26] rounded-xl hover:bg-[#fafaf9] transition-all duration-300 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-8 p-6 rounded-xl bg-white border border-[#e7e5e4]">
            <h3 className="text-sm font-semibold text-[#1c1917] mb-3 uppercase tracking-wider">Quick Tips</h3>
            <ul className="space-y-2 text-sm text-[#78716c]">
              <li className="flex gap-2">
                <svg className="w-5 h-5 text-[#c67b5c] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Use descriptive event names (e.g., "Sarah & John's Wedding 2024")
              </li>
              <li className="flex gap-2">
                <svg className="w-5 h-5 text-[#c67b5c] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Double-check the email address - clients need it to access photos
              </li>
              <li className="flex gap-2">
                <svg className="w-5 h-5 text-[#c67b5c] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                You can update payment status and email later if needed
              </li>
            </ul>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}