"use client";

import AdminGuard from "@/components/AdminGaurd";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { TrashIcon } from "@heroicons/react/24/outline";

type PreviewFile = {
  file: File;
  preview: string;
};

type ExistingPhoto = {
  id: string;
  name: string;
  image_url: string;
};

type GalleryInfo = {
  event_name: string;
  client_email: string;
  event_date: string | null; // ✅ NEW
};

export default function AdminGalleryUploadPage() {
  const { galleryId } = useParams<{ galleryId: string }>();

  const [files, setFiles] = useState<PreviewFile[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<ExistingPhoto[]>([]);
  const [gallery, setGallery] = useState<GalleryInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingPhotos, setFetchingPhotos] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  /* ----------------------------------
     Load gallery info
  ---------------------------------- */
  useEffect(() => {
    const loadGallery = async () => {
      const { data, error } = await supabase
        .from("galleries")
        .select("event_name, client_email, event_date") // ✅ include event_date
        .eq("id", galleryId)
        .single();

      if (!error && data) setGallery(data);
    };

    if (galleryId) loadGallery();
  }, [galleryId]);

  /* ----------------------------------
     Fetch photos from DB
  ---------------------------------- */
  const fetchPhotos = async () => {
    setFetchingPhotos(true);

    const { data, error } = await supabase
      .from("photos")
      .select("id, name, image_url")
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

  /* ----------------------------------
     Handle file selection
  ---------------------------------- */
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

  /* ----------------------------------
     Upload images (Storage + DB)
  ---------------------------------- */
  const uploadImages = async () => {
    if (files.length === 0) {
      toast.error("Please select images to upload");
      return;
    }

    setLoading(true);

    for (const item of files) {
      const filePath = `${galleryId}/${Date.now()}-${item.file.name}`;

      // 1️⃣ Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("Photo-Delivery-Storage")
        .upload(filePath, item.file);

      if (uploadError) {
        console.error(uploadError);
        toast.error(`Failed to upload ${item.file.name}`);
        setLoading(false);
        return;
      }

      // 2️⃣ Get public URL
      const { data: publicUrlData } = supabase.storage
        .from("Photo-Delivery-Storage")
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;

      // 3️⃣ Insert into database
      const { error: dbError } = await supabase.from("photos").insert({
        gallery_id: galleryId,
        name: item.file.name,
        image_url: publicUrl,
      });

      if (dbError) {
        console.error(dbError);
        toast.error(`Uploaded but failed to save record: ${item.file.name}`);
      }
    }

    toast.success("Photos uploaded successfully!");
    setFiles([]);
    fetchPhotos();
    setLoading(false);
  };

  /* ----------------------------------
     Delete photo (Storage + DB)
  ---------------------------------- */
  const deletePhoto = async (photoId: string) => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p>Delete this photo permanently?</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 text-sm rounded-md border"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);

              try {
                const { data: photo, error: fetchError } = await supabase
                  .from("photos")
                  .select("image_url")
                  .eq("id", photoId)
                  .single();

                if (fetchError || !photo) throw new Error("Photo not found");

                const path = decodeURIComponent(
                  photo.image_url.split("/Photo-Delivery-Storage/")[1]
                );

                const { error: storageError } = await supabase.storage
                  .from("Photo-Delivery-Storage")
                  .remove([path]);

                if (storageError) throw storageError;

                const { error: dbError } = await supabase
                  .from("photos")
                  .delete()
                  .eq("id", photoId);

                if (dbError) throw dbError;

                toast.success("Photo deleted successfully ✅");
                fetchPhotos();
              } catch (err: any) {
                toast.error(err.message || "Failed to delete photo");
              }
            }}
            className="px-3 py-1 text-sm rounded-md bg-red-600 text-white"
          >
            Delete
          </button>
        </div>
      </div>
    ));
  };

  /* ----------------------------------
     UI
  ---------------------------------- */
  return (
    <AdminGuard>
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-10">
        {/* Header */}
        <div className="rounded-2xl bg-gradient-to-br from-primary/90 via-primary to-purple-600 p-8 text-primary-foreground shadow-xl">
          <h1 className="text-3xl font-bold">Upload Photos</h1>

          {gallery && (
            <div className="mt-2 text-primary-foreground/80 space-y-1">
              <p>
                <strong>{gallery.event_name}</strong> — {gallery.client_email}
              </p>
              {gallery.event_date && (
                <p className="text-sm">
                  📅 Event Date:{" "}
                  {new Date(gallery.event_date).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Upload Area */}
        <div className="rounded-2xl border bg-card p-8 shadow-sm space-y-6">
          <h2 className="text-xl font-semibold">Add Images</h2>

          {/* Drag & Drop */}
          <label
            className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center transition-all cursor-pointer ${
              dragActive
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/60"
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
            <div className="text-muted-foreground">
              <p className="text-lg font-medium">Drag & drop images here</p>
              <p className="text-sm mt-1">
                or click to browse from your computer
              </p>
            </div>
          </label>

          {/* Preview Selected */}
          {files.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground">
                Selected Photos ({files.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {files.map((item, index) => (
                  <div
                    key={index}
                    className="group relative overflow-hidden rounded-lg border bg-muted/30"
                  >
                    <div className="relative h-40 w-full">
                      <Image
                        src={item.preview}
                        alt="Preview"
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        className="object-cover transition-transform group-hover:scale-[1.03]"
                      />
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute top-2 right-2 rounded-full bg-black/60 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Button */}
          <div className="flex items-center justify-between pt-4">
            <Button onClick={uploadImages} disabled={loading}>
              {loading ? "Uploading…" : "Upload Photos"}
            </Button>
          </div>
        </div>

        {/* Existing Photos */}
        <div className="rounded-2xl border bg-card p-8 shadow-sm space-y-6">
          <h2 className="text-xl font-semibold">Existing Photos</h2>

          {fetchingPhotos ? (
            <p className="text-muted-foreground">Loading photos…</p>
          ) : existingPhotos.length === 0 ? (
            <p className="text-muted-foreground">No photos uploaded yet.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {existingPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative group overflow-hidden rounded-lg border bg-muted/10"
                >
                  <div className="relative h-40 w-full">
                    <Image
                      src={photo.image_url}
                      alt={photo.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      className="object-cover transition-transform group-hover:scale-[1.03]"
                    />
                  </div>
                  <button
                    onClick={() => deletePhoto(photo.id)}
                    className="absolute top-2 right-2 rounded-full bg-red-600 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition"
                  >
                    <TrashIcon className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminGuard>
  );
}
