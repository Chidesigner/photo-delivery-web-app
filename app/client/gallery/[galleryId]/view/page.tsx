"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import {
  ArrowDownTrayIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlayIcon,
} from "@heroicons/react/24/outline";

/* ------------------------------
   Types
------------------------------ */
type Gallery = {
  event_name: string;
  paid: boolean;
  event_date: string | null;
};

type Photo = {
  id: string;
  name: string;
  image_url: string;
};

/* ------------------------------
   Page
------------------------------ */
export default function ClientGalleryViewPage() {
  const { galleryId } = useParams<{ galleryId: string }>();

  const [gallery, setGallery] = useState<Gallery | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isSlideshow, setIsSlideshow] = useState(false);

  const slideshowInterval = useRef<number | null>(null);
  const activePhoto = activeIndex !== null ? photos[activeIndex] : null;

  /* ------------------------------
     Load gallery + photos
  ------------------------------ */
  const loadGallery = async () => {
    try {
      const { data: galleryData, error } = await supabase
        .from("galleries")
        .select("event_name, paid, event_date")
        .eq("id", galleryId)
        .maybeSingle();

      if (error || !galleryData) {
        throw new Error("Gallery not found");
      }

      setGallery(galleryData);

      const { data: photosData, error: photosError } = await supabase
        .from("photos")
        .select("id, name, image_url")
        .eq("gallery_id", galleryId)
        .order("created_at", { ascending: true });

      if (photosError) throw new Error("Failed to load photos");

      setPhotos(photosData || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load gallery");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (galleryId) loadGallery();
  }, [galleryId]);

  /* ------------------------------
     Download logic
  ------------------------------ */
  const downloadPhoto = async (photo: Photo) => {
    if (!gallery?.paid) {
      toast("Oops, you have a pending payment. Kindly complete payment to download photos.", {
        icon: "🔒",
      });
      return;
    }

    try {
      const response = await fetch(photo.image_url);
      const blob = await response.blob();
      saveAs(blob, photo.name);
    } catch {
      toast.error("Failed to download photo");
    }
  };

  const downloadAll = async () => {
    if (!gallery?.paid) {
      toast("Oops, you have a pending payment. Kindly complete payment to download photos.", {
        icon: "🔒",
      });
      return;
    }

    if (photos.length === 0) return;

    const zip = new JSZip();
    const folder = zip.folder(gallery.event_name || "gallery");

    try {
      for (const photo of photos) {
        const response = await fetch(photo.image_url);
        const blob = await response.blob();
        folder?.file(photo.name, blob);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, `${gallery.event_name || "gallery"}.zip`);
    } catch {
      toast.error("Failed to download gallery");
    }
  };

  /* ------------------------------
     Navigation
  ------------------------------ */
  const openViewer = (index: number, slideshow = false) => {
    setActiveIndex(index);
    setIsSlideshow(slideshow);
  };

  const closeViewer = () => {
    setActiveIndex(null);
    setIsSlideshow(false);
  };

  const nextPhoto = () => {
    setActiveIndex((prev) =>
      prev !== null && prev < photos.length - 1 ? prev + 1 : prev
    );
  };

  const prevPhoto = () => {
    setActiveIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
  };

  /* ------------------------------
     Keyboard navigation
  ------------------------------ */
  useEffect(() => {
    if (activeIndex === null) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextPhoto();
      if (e.key === "ArrowLeft") prevPhoto();
      if (e.key === "Escape") closeViewer();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeIndex]);

  /* ------------------------------
     Slideshow auto play
  ------------------------------ */
  useEffect(() => {
    if (!isSlideshow || activeIndex === null) {
      if (slideshowInterval.current) {
        clearInterval(slideshowInterval.current);
        slideshowInterval.current = null;
      }
      return;
    }

    slideshowInterval.current = window.setInterval(() => {
      setActiveIndex((prev) =>
        prev !== null && prev < photos.length - 1 ? prev + 1 : 0
      );
    }, 4000);

    return () => {
      if (slideshowInterval.current) {
        clearInterval(slideshowInterval.current);
        slideshowInterval.current = null;
      }
    };
  }, [isSlideshow, activeIndex]);

  /* ------------------------------
     Render states
  ------------------------------ */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading gallery…
      </div>
    );
  }

  if (!gallery) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full p-8 border rounded-2xl bg-card shadow-xl text-center">
          <h1 className="text-2xl font-bold mb-4">Gallery not found</h1>
        </div>
      </div>
    );
  }

  /* ------------------------------
     Page
  ------------------------------ */
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      {/* HERO COVER */}
      {photos.length > 0 && (
        <div
          className="relative h-[85vh] w-full flex items-center justify-center"
          style={{
            backgroundImage: `url(${photos[0].image_url})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative text-center px-6">
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-white mb-4">
              {gallery.event_name}
            </h1>
            {gallery.event_date && (
              <p className="text-white/80 text-lg tracking-wide">
                {new Date(gallery.event_date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}

            <div className="mt-10 flex justify-center gap-4">
              <Button
                onClick={() => openViewer(0, false)}
                className="bg-white text-black hover:bg-white/90 px-8 py-6 text-lg"
              >
                View Gallery
              </Button>
              <Button
                onClick={() => openViewer(0, true)}
                className="bg-transparent border border-white text-white hover:bg-white/10 px-8 py-6 text-lg flex gap-2"
              >
                <PlayIcon className="w-5 h-5" />
                Slideshow
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ACTION BAR */}
      <div className="max-w-450 mx-auto px-6 md:px-12 pt-16 flex justify-end">
        <Button onClick={downloadAll} className="flex gap-2">
          <ArrowDownTrayIcon className="w-5 h-5" />
          Download All
        </Button>
      </div>

      {/* FULL-WIDTH, NATURAL RATIO GALLERY */}
      <div className="max-w-450 mx-auto px-6 md:px-12 py-16">
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-8 space-y-8">
          {photos.map((photo, i) => (
            <div
              key={photo.id}
              className="relative group w-full overflow-hidden rounded-2xl cursor-pointer bg-neutral-100"
              onClick={() => openViewer(i, false)}
            >
              <Image
                src={photo.image_url}
                alt={photo.name}
                width={1200}
                height={800}
                className="w-full h-auto transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              />

              {/* Subtle overlay */}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition" />

              {/* Download icon */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  downloadPhoto(photo);
                }}
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition bg-black/70 text-white p-2.5 rounded-full hover:bg-black/90 z-10"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* FULLSCREEN VIEWER */}
      {activePhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-6"
          onClick={closeViewer}
        >
          <div
            className="relative w-full max-w-7xl max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={closeViewer}
              className="absolute top-4 right-4 text-white p-2 bg-black/40 rounded-full hover:bg-black/70 transition z-20"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>

            {/* Prev */}
            {activeIndex! > 0 && (
              <button
                onClick={prevPhoto}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white p-3 bg-black/40 rounded-full hover:bg-black/70 transition z-20"
              >
                <ChevronLeftIcon className="w-6 h-6" />
              </button>
            )}

            {/* Next */}
            {activeIndex! < photos.length - 1 && (
              <button
                onClick={nextPhoto}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white p-3 bg-black/40 rounded-full hover:bg-black/70 transition z-20"
              >
                <ChevronRightIcon className="w-6 h-6" />
              </button>
            )}

            {/* Image */}
            <div className="relative w-full h-[80vh]">
              <Image
                src={activePhoto.image_url}
                alt={activePhoto.name}
                fill
                className="object-contain"
              />
            </div>

            {/* Footer */}
            <div className="mt-4 flex justify-between items-center text-white">
              <p className="text-sm opacity-80">{activePhoto.name}</p>
              <Button
                onClick={() => downloadPhoto(activePhoto)}
                className="flex gap-2"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
                Download
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
