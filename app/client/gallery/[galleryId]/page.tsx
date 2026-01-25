"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

export default function ClientGalleryAccessPage() {
  const { galleryId } = useParams<{ galleryId: string }>();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  const handleAccess = async () => {
    if (!email) return toast.error("Please enter your email");

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("galleries")
        .select("id, event_name, paid, event_date")
        .eq("id", galleryId)
        .eq("client_email", email.toLowerCase().trim())
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

      router.push(`/client/gallery/${galleryId}/view`);
    } catch (err: any) {
      console.error("Gallery access error:", err);
      toast.error(err.message || "Failed to access gallery");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAccess();
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-neutral-50 via-white to-neutral-100">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md px-6 animate-fade-in">
        {/* Logo/Brand area */}
        <div className="text-center mb-12">
          <div className="inline-block">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-3xl font-light text-neutral-800 tracking-tight">
              Your Gallery Awaits
            </h1>
            <p className="text-neutral-500 mt-2 text-sm">
              Enter your email to view your photos
            </p>
          </div>
        </div>

        {/* Access card */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-neutral-200/50 p-8 border border-neutral-100 backdrop-blur-sm">
          <div className="space-y-6">
            {/* Email input */}
            <div className="relative">
              <label 
                htmlFor="email"
                className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                  focused || email
                    ? "text-xs -top-2 bg-white px-2 text-purple-600"
                    : "top-3.5 text-neutral-400"
                }`}
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-3.5 border-2 border-neutral-200 rounded-xl focus:border-purple-500 focus:outline-none transition-all duration-200 bg-white text-neutral-800"
                disabled={loading}
              />
            </div>

            {/* Access button */}
            <button
              onClick={handleAccess}
              disabled={loading || !email}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3.5 rounded-xl font-medium shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Accessing...
                </span>
              ) : (
                "Access Gallery"
              )}
            </button>
          </div>
        </div>

        {/* Footer text */}
        <p className="text-center text-neutral-400 text-xs mt-8">
          Private and secure gallery access
        </p>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}