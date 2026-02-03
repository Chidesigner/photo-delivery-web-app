"use client";

import { useState, useEffect } from "react";
import AdminGuard from "@/components/AdminGaurd";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { TrashIcon, StarIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";

type PortfolioPhoto = {
  id: string;
  title: string;
  category: string;
  image_url: string;
  public_id?: string;
  is_featured: boolean;
  display_order: number;
};

const CATEGORIES = [
  { value: "wedding", label: "Wedding" },
  { value: "portrait", label: "Portrait" },
  { value: "event", label: "Event" },
  { value: "ceremony", label: "Naming Ceremony" },
  { value: "corporate", label: "Corporate" },
  { value: "other", label: "Other" },
];

export default function AdminPortfolioPage() {
  const [photos, setPhotos] = useState<PortfolioPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Upload form state
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("wedding");
  const [isFeatured, setIsFeatured] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // Fetch portfolio
  const fetchPhotos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("portfolio")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load portfolio");
    } else {
      setPhotos(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeMB = file.size / 1024 / 1024;
    if (sizeMB > 20) {
      toast.error("File too large. Maximum 20MB.");
      return;
    }

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  // Upload photo
  const uploadPhoto = async () => {
    if (!selectedFile || !title) {
      toast.error("Please select a file and enter a title");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("galleryId", "portfolio"); // Use portfolio folder

      const res = await fetch("/api/upload-photo", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      // Save to database
      const { error: dbError } = await supabase.from("portfolio").insert({
        title,
        category,
        image_url: data.url,
        public_id: data.public_id,
        is_featured: isFeatured,
        display_order: photos.length,
      });

      if (dbError) throw dbError;

      toast.success("Photo uploaded successfully!");
      
      // Reset form
      setTitle("");
      setCategory("wedding");
      setIsFeatured(false);
      setSelectedFile(null);
      setPreview(null);
      
      fetchPhotos();
    } catch (error: any) {
      toast.error(error.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // Toggle featured
  const toggleFeatured = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("portfolio")
      .update({ is_featured: !currentStatus })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update");
    } else {
      toast.success(currentStatus ? "Removed from featured" : "Added to featured");
      fetchPhotos();
    }
  };

  // Delete photo
  const deletePhoto = async (id: string, publicId?: string) => {
    if (!confirm("Delete this photo from portfolio?")) return;

    try {
      // Delete from Cloudinary
      if (publicId) {
        await fetch("/api/delete-photo", {
          method: "POST",
          body: JSON.stringify({ public_id: publicId }),
          headers: { "Content-Type": "application/json" },
        });
      }

      // Delete from database
      const { error } = await supabase.from("portfolio").delete().eq("id", id);

      if (error) throw error;

      toast.success("Photo deleted");
      fetchPhotos();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete");
    }
  };

  return (
    <AdminGuard>
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-10">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Portfolio Management</h1>
          <p className="text-muted-foreground mt-2">
            Upload and manage your portfolio photos
          </p>
        </div>

        {/* Upload Section */}
        <div className="rounded-2xl border bg-card p-8 shadow-sm space-y-6">
          <h2 className="text-xl font-semibold">Upload New Photo</h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Wedding at Eko Hotel"
                  className="w-full px-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm">
                  Show on homepage (Featured)
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum 20MB. Best quality photos only!
                </p>
              </div>

              <Button
                onClick={uploadPhoto}
                disabled={uploading || !selectedFile || !title}
                className="w-full"
              >
                {uploading ? "Uploading..." : "Upload to Portfolio"}
              </Button>
            </div>

            {/* Preview */}
            <div>
              {preview ? (
                <div className="relative aspect-square rounded-xl overflow-hidden bg-muted">
                  <Image
                    src={preview}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-square rounded-xl border-2 border-dashed border-border flex items-center justify-center text-muted-foreground">
                  Select a photo to preview
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Portfolio Grid */}
        <div className="rounded-2xl border bg-card p-8 shadow-sm space-y-6">
          <h2 className="text-xl font-semibold">
            Portfolio Photos ({photos.length})
          </h2>

          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : photos.length === 0 ? (
            <p className="text-muted-foreground">No photos yet. Upload your first one!</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="group relative aspect-square rounded-lg overflow-hidden bg-muted"
                >
                  <Image
                    src={photo.image_url}
                    alt={photo.title}
                    fill
                    className="object-cover"
                  />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                    <div className="flex justify-between items-start">
                      <button
                        onClick={() => toggleFeatured(photo.id, photo.is_featured)}
                        className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                      >
                        {photo.is_featured ? (
                          <StarSolidIcon className="w-5 h-5 text-yellow-400" />
                        ) : (
                          <StarIcon className="w-5 h-5 text-white" />
                        )}
                      </button>

                      <button
                        onClick={() => deletePhoto(photo.id, photo.public_id)}
                        className="p-2 bg-red-600/80 hover:bg-red-600 rounded-lg transition-colors"
                      >
                        <TrashIcon className="w-5 h-5 text-white" />
                      </button>
                    </div>

                    <div className="text-white">
                      <p className="font-medium text-sm">{photo.title}</p>
                      <p className="text-xs text-white/70 capitalize">
                        {photo.category}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminGuard>
  );
}