"use client";

import { useState, useEffect, useRef } from "react";
import AdminGuard from "@/components/AdminGaurd";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { TrashIcon, StarIcon, CloudArrowUpIcon, PhotoIcon } from "@heroicons/react/24/outline";
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
  const [compressing, setCompressing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Compress image to reduce file size
  const compressImage = async (file: File, maxSizeMB: number = 2): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target?.result as string;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Calculate new dimensions (max 2000px on longest side)
          const maxDimension = 2000;
          if (width > height) {
            if (width > maxDimension) {
              height = (height * maxDimension) / width;
              width = maxDimension;
            }
          } else {
            if (height > maxDimension) {
              width = (width * maxDimension) / height;
              height = maxDimension;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Start with quality 0.9 and reduce if needed
          let quality = 0.9;
          
          const tryCompress = () => {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error('Compression failed'));
                  return;
                }
                
                const sizeMB = blob.size / 1024 / 1024;
                
                // If still too large and quality can be reduced, try again
                if (sizeMB > maxSizeMB && quality > 0.5) {
                  quality -= 0.1;
                  tryCompress();
                } else {
                  // Create new file from blob
                  const compressedFile = new File([blob], file.name, {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                  });
                  resolve(compressedFile);
                }
              },
              'image/jpeg',
              quality
            );
          };
          
          tryCompress();
        };
        
        img.onerror = () => reject(new Error('Failed to load image'));
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
    });
  };

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeMB = file.size / 1024 / 1024;
    
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    // If file is larger than 2MB, compress it
    if (sizeMB > 2) {
      setCompressing(true);
      toast.loading("Optimizing image...", { id: "compress" });
      
      try {
        const compressedFile = await compressImage(file, 2);
        const compressedSizeMB = compressedFile.size / 1024 / 1024;
        
        toast.success(
          `Optimized from ${sizeMB.toFixed(1)}MB to ${compressedSizeMB.toFixed(1)}MB`,
          { id: "compress" }
        );
        
        setSelectedFile(compressedFile);
        setPreview(URL.createObjectURL(compressedFile));
      } catch (error) {
        toast.error("Failed to optimize image", { id: "compress" });
        console.error(error);
      } finally {
        setCompressing(false);
      }
    } else {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
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
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
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

              {/* Custom File Upload Button */}
              <div>
                <label className="block text-sm font-medium mb-2">Photo</label>
                
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                {/* Custom upload button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={compressing}
                  className="w-full px-6 py-4 rounded-xl border-2 border-dashed border-border hover:border-primary transition-colors bg-muted/50 hover:bg-muted flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {compressing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm font-medium">Optimizing image...</span>
                    </>
                  ) : selectedFile ? (
                    <>
                      <PhotoIcon className="w-6 h-6 text-primary" />
                      <div className="text-left flex-1">
                        <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <span className="text-xs text-primary font-medium">Change</span>
                    </>
                  ) : (
                    <>
                      <CloudArrowUpIcon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                      <div className="text-left">
                        <p className="text-sm font-medium">Click to choose photo</p>
                        <p className="text-xs text-muted-foreground">
                          Images will be auto-optimized for best quality
                        </p>
                      </div>
                    </>
                  )}
                </button>
                
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Large files will be automatically compressed for faster upload
                </p>
              </div>

              <Button
                onClick={uploadPhoto}
                disabled={uploading || !selectedFile || !title || compressing}
                className="w-full"
              >
                {uploading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Uploading...
                  </span>
                ) : (
                  "Upload to Portfolio"
                )}
              </Button>
            </div>

            {/* Preview */}
            <div>
              {preview ? (
                <div className="space-y-3">
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-muted shadow-lg">
                    <Image
                      src={preview}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Preview</span>
                    {selectedFile && (
                      <span className="text-xs text-muted-foreground">
                        {selectedFile.size > 2 * 1024 * 1024 ? (
                          <span className="text-green-600 font-medium">✓ Optimized</span>
                        ) : (
                          `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
                        )}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground gap-3 bg-muted/30">
                  <PhotoIcon className="w-16 h-16 opacity-20" />
                  <p className="text-sm">Select a photo to preview</p>
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
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">Loading portfolio...</p>
              </div>
            </div>
          ) : photos.length === 0 ? (
            <div className="text-center py-12">
              <PhotoIcon className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground">No photos yet. Upload your first one!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="group relative aspect-square rounded-lg overflow-hidden bg-muted shadow-sm hover:shadow-lg transition-shadow"
                >
                  <Image
                    src={photo.image_url}
                    alt={photo.title}
                    fill
                    className="object-cover"
                  />

                  {/* Featured Badge */}
                  {photo.is_featured && (
                    <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 shadow-lg">
                      <StarSolidIcon className="w-3 h-3" />
                      Featured
                    </div>
                  )}

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                    <div className="flex justify-between items-start">
                      <button
                        onClick={() => toggleFeatured(photo.id, photo.is_featured)}
                        className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors backdrop-blur-sm"
                        title={photo.is_featured ? "Remove from featured" : "Add to featured"}
                      >
                        {photo.is_featured ? (
                          <StarSolidIcon className="w-5 h-5 text-yellow-400" />
                        ) : (
                          <StarIcon className="w-5 h-5 text-white" />
                        )}
                      </button>

                      <button
                        onClick={() => deletePhoto(photo.id, photo.public_id)}
                        className="p-2 bg-red-600/80 hover:bg-red-600 rounded-lg transition-colors backdrop-blur-sm"
                        title="Delete photo"
                      >
                        <TrashIcon className="w-5 h-5 text-white" />
                      </button>
                    </div>

                    <div className="text-white">
                      <p className="font-medium text-sm line-clamp-1">{photo.title}</p>
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