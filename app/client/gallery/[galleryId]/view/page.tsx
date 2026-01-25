"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import JSZip from "jszip";
import { saveAs } from "file-saver";

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

export default function ClientGalleryViewPage() {
  const { galleryId } = useParams<{ galleryId: string }>();

  const [gallery, setGallery] = useState<Gallery | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isSlideshow, setIsSlideshow] = useState(false);
  const [imageLoaded, setImageLoaded] = useState<{ [key: number]: boolean }>({});

  const slideshowInterval = useRef<number | null>(null);
  const activePhoto = activeIndex !== null ? photos[activeIndex] : null;

  /* Load gallery + photos */
  const loadGallery = async () => {
    try {
      const { data: galleryData, error } = await supabase
        .from("galleries")
        .select("event_name, paid, event_date")
        .eq("id", galleryId)
        .maybeSingle();

      if (error || !galleryData) throw new Error("Gallery not found");

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

  /* Download logic */
  const downloadPhoto = async (photo: Photo) => {
    if (!gallery?.paid) {
      toast("Complete payment to download photos", { icon: "🔒", duration: 4000 });
      return;
    }

    try {
      const response = await fetch(photo.image_url);
      const blob = await response.blob();
      saveAs(blob, photo.name);
      toast.success("Download started");
    } catch {
      toast.error("Failed to download photo");
    }
  };

  const downloadAll = async () => {
    if (!gallery?.paid) {
      toast("Complete payment to download photos", { icon: "🔒", duration: 4000 });
      return;
    }

    if (photos.length === 0) return;

    toast.loading("Preparing download...", { id: "zip" });
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
      toast.success("Download complete!", { id: "zip" });
    } catch {
      toast.error("Failed to download gallery", { id: "zip" });
    }
  };

  /* Navigation */
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

  /* Keyboard navigation */
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

  /* Slideshow auto play */
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-neutral-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-600 font-light">Loading your gallery...</p>
        </div>
      </div>
    );
  }

  if (!gallery) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-neutral-50">
        <div className="max-w-md w-full p-12 border border-neutral-200 rounded-3xl bg-white shadow-xl text-center">
          <h1 className="text-2xl font-light text-neutral-800 mb-2">Gallery Not Found</h1>
          <p className="text-neutral-500 text-sm">This gallery may have been removed or the link is incorrect.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* HERO SECTION */}
      {photos.length > 0 && (
        <div className="relative h-screen w-full flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src={photos[0].image_url}
              alt={gallery.event_name}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
          </div>

          <div className="relative z-10 text-center px-6 max-w-4xl animate-fade-in-up">
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-white mb-6 tracking-tight">
              {gallery.event_name}
            </h1>
            {gallery.event_date && (
              <p className="text-white/90 text-lg md:text-xl tracking-[0.2em] uppercase font-light mb-12">
                {new Date(gallery.event_date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={() => openViewer(0, false)}
                className="group px-10 py-4 bg-white text-black hover:bg-white/95 rounded-full font-medium transition-all duration-300 hover:scale-105 shadow-2xl"
              >
                <span className="flex items-center justify-center gap-2">
                  View Gallery
                  <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </button>
              <button
                onClick={() => openViewer(0, true)}
                className="px-10 py-4 bg-white/10 backdrop-blur-md border-2 border-white/30 text-white hover:bg-white/20 rounded-full font-medium transition-all duration-300 hover:scale-105"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Slideshow
                </span>
              </button>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <svg className="w-6 h-6 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      )}

      {/* GALLERY INFO BAR */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-neutral-200/50 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-6 md:px-12 py-4 flex justify-between items-center">
          <div>
            <h2 className="font-medium text-neutral-800">{photos.length} Photos</h2>
          </div>
          <button
            onClick={downloadAll}
            className="group flex items-center gap-2 px-6 py-2.5 bg-neutral-900 text-white rounded-full hover:bg-neutral-800 transition-all duration-300 hover:scale-105 shadow-lg"
          >
            <svg className="w-5 h-5 transition-transform group-hover:translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download All
          </button>
        </div>
      </div>

      {/* MASONRY GALLERY */}
      <div className="max-w-[1800px] mx-auto px-6 md:px-12 py-16">
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
          {photos.map((photo, i) => (
            <div
              key={photo.id}
              className={`relative group break-inside-avoid cursor-pointer transition-all duration-500 ${
                imageLoaded[i] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              onClick={() => openViewer(i, false)}
              style={{ transitionDelay: `${i * 50}ms` }}
            >
              <div className="relative overflow-hidden rounded-2xl bg-neutral-100 shadow-md hover:shadow-2xl transition-all duration-500">
                <Image
                  src={photo.image_url}
                  alt={photo.name}
                  width={1200}
                  height={800}
                  className="w-full h-auto transition-transform duration-700 ease-out group-hover:scale-105"
                  onLoad={() => setImageLoaded(prev => ({ ...prev, [i]: true }))}
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Download button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadPhoto(photo);
                  }}
                  className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/90 backdrop-blur-sm text-neutral-900 p-3 rounded-full hover:bg-white hover:scale-110 shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>

                {/* Photo number indicator */}
                <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-white text-sm font-medium bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
                    {i + 1} / {photos.length}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* LIGHTBOX */}
      {activePhoto && (
        <div className="fixed inset-0 z-50 bg-black/98 backdrop-blur-sm">
          <div className="absolute inset-0 flex items-center justify-center p-4 md:p-8">
            {/* Close button */}
            <button
              onClick={closeViewer}
              className="absolute top-6 right-6 text-white/80 hover:text-white p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all duration-300 hover:rotate-90 z-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Navigation */}
            {activeIndex! > 0 && (
              <button
                onClick={prevPhoto}
                className="absolute left-6 top-1/2 -translate-y-1/2 text-white p-4 bg-white/10 hover:bg-white/20 rounded-full transition-all duration-300 hover:scale-110 z-50"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {activeIndex! < photos.length - 1 && (
              <button
                onClick={nextPhoto}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-white p-4 bg-white/10 hover:bg-white/20 rounded-full transition-all duration-300 hover:scale-110 z-50"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {/* Image */}
            <div className="relative w-full h-full max-w-7xl max-h-[85vh]">
              <Image
                src={activePhoto.image_url}
                alt={activePhoto.name}
                fill
                className="object-contain"
                priority
              />
            </div>

            {/* Bottom bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
              <div className="max-w-7xl mx-auto flex justify-between items-center">
                <div className="text-white">
                  <p className="text-sm opacity-70">
                    {activeIndex! + 1} / {photos.length}
                  </p>
                  <p className="text-lg font-light mt-1">{activePhoto.name}</p>
                </div>
                <button
                  onClick={() => downloadPhoto(activePhoto)}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full hover:bg-white/90 transition-all duration-300 hover:scale-105 font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out;
        }
      `}</style>
    </div>
  );
}