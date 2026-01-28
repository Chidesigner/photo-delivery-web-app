"use client";

import AdminGuard from "@/components/AdminGaurd";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

type PreviewFile = {
  file: File;
  preview: string;
};

type ExistingPhoto = {
  id: string;
  name: string;
  image_url: string;
  public_id?: string;
};

type GalleryInfo = {
  event_name: string;
  client_email: string;
  event_date: string | null;
};

export default function AdminGalleryUploadPage() {
  const { galleryId } = useParams<{ galleryId: string }>();
  const router = useRouter();

  const [files, setFiles] = useState<PreviewFile[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<ExistingPhoto[]>([]);
  const [gallery, setGallery] = useState<GalleryInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingPhotos, setFetchingPhotos] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  /* Load gallery info */
  useEffect(() => {
    const loadGallery = async () => {
      const { data, error } = await supabase
        .from("galleries")
        .select("event_name, client_email, event_date")
        .eq("id", galleryId)
        .single();

      if (!error && data) setGallery(data);
    };

    if (galleryId) loadGallery();
  }, [galleryId]);

  /* Fetch photos from DB */
  const fetchPhotos = async () => {
    setFetchingPhotos(true);

    const { data, error } = await supabase
      .from("photos")
      .select("id, name, image_url, public_id")
      .eq("gallery_id", galleryId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      toast.error("Failed to fetch photos");
    } else {
      setExistingPhotos(data || []);
    }

    setFetchingPhotos(false);
  };

  useEffect(() => {
    if (galleryId) fetchPhotos();
  }, [galleryId]);

  /* Handle file selection */
  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;

    const newFiles = Array.from(fileList).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  /* Upload images to Cloudinary + DB */
  const uploadImages = async () => {
    if (files.length === 0) {
      toast.error("Please select images to upload");
      return;
    }

    setLoading(true);
    let successCount = 0;

    for (const item of files) {
      try {
        const formData = new FormData();
        formData.append("file", item.file);
        formData.append("galleryId", galleryId);

        const res = await fetch("/api/upload-photo", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(`Failed to upload ${item.file.name}`);
          continue;
        }

        const publicUrl = data.url;
        const publicId = data.public_id;

        const { error: dbError } = await supabase.from("photos").insert({
          gallery_id: galleryId,
          name: item.file.name,
          image_url: publicUrl,
          public_id: publicId,
        });

        if (dbError) {
          console.error(dbError);
          toast.error(`Uploaded but failed to save record: ${item.file.name}`);
        } else {
          successCount++;
        }
      } catch (err: any) {
        console.error(err);
        toast.error(`Failed to upload ${item.file.name}`);
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} photo${successCount > 1 ? 's' : ''} uploaded successfully!`, {
        style: {
          background: '#059669',
          color: '#fff',
          borderRadius: '12px',
        }
      });
    }

    setFiles([]);
    fetchPhotos();
    setLoading(false);
  };

  /* Delete photo from Cloudinary + DB */
  const deletePhoto = async (photoId: string, photoName: string, publicId?: string) => {
    toast((t) => (
      <div className="flex flex-col gap-4 min-w-[300px]">
        <div>
          <p className="font-semibold text-[#1c1917] mb-1">Delete Photo?</p>
          <p className="text-sm text-[#78716c] leading-relaxed">
            Permanently delete "<strong>{photoName}</strong>"? This cannot be undone.
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-5 py-2 text-sm rounded-lg border border-[#e7e5e4] bg-white hover:bg-[#fafaf9] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);

              try {
                // Delete from Cloudinary
                if (publicId) {
                  const cloudRes = await fetch("/api/delete-photo", {
                    method: "POST",
                    body: JSON.stringify({ public_id: publicId }),
                    headers: { "Content-Type": "application/json" },
                  });

                  const cloudData = await cloudRes.json();
                  
                  if (!cloudRes.ok) {
                    throw new Error(
                      cloudData.error || "Failed to delete photo from Cloudinary"
                    );
                  }
                }

                // Delete from DB
                const { error: dbError } = await supabase
                  .from("photos")
                  .delete()
                  .eq("id", photoId);

                if (dbError) throw dbError;

                toast.success("Photo deleted successfully", {
                  style: {
                    background: '#059669',
                    color: '#fff',
                    borderRadius: '12px',
                  }
                });
                fetchPhotos();
              } catch (err: any) {
                console.error("Delete error:", err);
                toast.error(err.message || "Failed to delete photo");
              }
            }}
            className="px-5 py-2 text-sm rounded-lg bg-[#dc2626] text-white hover:bg-[#b91c1c] transition-colors"
          >
            Delete Photo
          </button>
        </div>
      </div>
    ), {
      duration: 8000,
      style: {
        background: '#fff',
        borderRadius: '16px',
        border: '1px solid #e7e5e4',
        padding: '20px',
      }
    });
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-[#fafaf9]">
        {/* Header */}
        <div className="bg-white border-b border-[#e7e5e4]">
          <div className="max-w-7xl mx-auto px-6 md:px-12 py-8">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => router.push("/admin/galleries")}
                className="flex items-center gap-2 text-[#78716c] hover:text-[#c67b5c] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Galleries
              </button>
            </div>

            {gallery && (
              <div>
                <h1 className="text-4xl font-light text-[#1c1917] mb-3">
                  {gallery.event_name}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-[#78716c]">
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {gallery.client_email}
                  </span>
                  {gallery.event_date && (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(gallery.event_date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  )}
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {existingPhotos.length} {existingPhotos.length === 1 ? 'photo' : 'photos'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 space-y-8">
          {/* Upload Section */}
          <div className="bg-white rounded-2xl border border-[#e7e5e4] shadow-sm overflow-hidden">
            <div className="p-6 border-b border-[#e7e5e4]">
              <h2 className="text-2xl font-medium text-[#1c1917]">Upload Photos</h2>
              <p className="text-[#78716c] mt-1">Add images to this gallery</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Drag & Drop Zone */}
              <label
                className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-16 text-center transition-all cursor-pointer ${
                  dragActive
                    ? "border-[#c67b5c] bg-[#c67b5c]/5"
                    : "border-[#e7e5e4] hover:border-[#c67b5c]/60 hover:bg-[#fafaf9]"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  handleFiles(e.dataTransfer.files);
                }}
              >
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#c67b5c] to-[#8b9e87] flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-[#1c1917]">
                  <p className="text-lg font-medium mb-1">Drop images here</p>
                  <p className="text-sm text-[#78716c]">
                    or click to browse from your computer
                  </p>
                  <p className="text-xs text-[#78716c] mt-2">
                    Supports JPG, PNG, WEBP
                  </p>
                </div>
              </label>

              {/* Selected Files Preview */}
              {files.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-[#1c1917]">
                      Selected Photos ({files.length})
                    </h3>
                    <button
                      onClick={() => setFiles([])}
                      className="text-sm text-[#78716c] hover:text-[#dc2626] transition-colors"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {files.map((item, index) => (
                      <div
                        key={index}
                        className="group relative overflow-hidden rounded-xl border border-[#e7e5e4] bg-[#fafaf9]"
                      >
                        <div className="relative h-48 w-full">
                          <Image
                            src={item.preview}
                            alt="Preview"
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="absolute top-2 right-2 p-2 rounded-lg bg-white/90 backdrop-blur-sm text-[#dc2626] opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:scale-110 shadow-lg"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Button */}
              {files.length > 0 && (
                <button
                  onClick={uploadImages}
                  disabled={loading}
                  className="w-full px-6 py-3.5 bg-[#2d2a26] text-white rounded-xl hover:bg-[#3d3731] transition-all duration-300 hover:scale-105 font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Uploading {files.length} {files.length === 1 ? 'photo' : 'photos'}...
                    </span>
                  ) : (
                    `Upload ${files.length} ${files.length === 1 ? 'Photo' : 'Photos'}`
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Existing Photos Section */}
          <div className="bg-white rounded-2xl border border-[#e7e5e4] shadow-sm overflow-hidden">
            <div className="p-6 border-b border-[#e7e5e4]">
              <h2 className="text-2xl font-medium text-[#1c1917]">Gallery Photos</h2>
              <p className="text-[#78716c] mt-1">
                {existingPhotos.length} {existingPhotos.length === 1 ? 'photo' : 'photos'} in this gallery
              </p>
            </div>

            <div className="p-6">
              {fetchingPhotos ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-[#e7e5e4] border-t-[#c67b5c] rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-[#78716c]">Loading photos...</p>
                  </div>
                </div>
              ) : existingPhotos.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-full bg-[#c67b5c]/10 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-[#c67b5c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-medium text-[#1c1917] mb-2">No photos yet</h3>
                  <p className="text-[#78716c]">Upload photos to get started</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {existingPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className="group relative overflow-hidden rounded-xl border border-[#e7e5e4] bg-[#fafaf9] hover:shadow-lg transition-all duration-300"
                    >
                      <div className="relative h-48 w-full">
                        <Image
                          src={photo.image_url}
                          alt={photo.name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Delete button */}
                      <button
                        onClick={() => deletePhoto(photo.id, photo.name, photo.public_id)}
                        className="absolute top-2 right-2 p-2 rounded-lg bg-[#fef2f2]/95 backdrop-blur-sm text-[#dc2626] opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-[#fee2e2] hover:scale-110 shadow-lg"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>

                      {/* Photo name */}
                      <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <p className="text-white text-sm font-medium truncate bg-black/40 backdrop-blur-sm px-2 py-1 rounded">
                          {photo.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}