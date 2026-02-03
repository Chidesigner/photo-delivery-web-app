"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

type PortfolioPhoto = {
  id: string;
  title: string;
  category: string;
  image_url: string;
  is_featured: boolean;
};

const CATEGORIES = [
  { id: "all", label: "All Work" },
  { id: "wedding", label: "Weddings" },
  { id: "portrait", label: "Portraits" },
  { id: "event", label: "Events" },
  { id: "ceremony", label: "Naming Ceremonies" },
  { id: "corporate", label: "Corporate" },
  { id: "other", label: "Other" },
];

export default function GalleryPage() {
  const [photos, setPhotos] = useState<PortfolioPhoto[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<PortfolioPhoto[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch portfolio photos
  useEffect(() => {
    const fetchPhotos = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("portfolio")
        .select("*")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        toast.error("Failed to load gallery");
      } else {
        setPhotos(data || []);
        setFilteredPhotos(data || []);
      }
      setLoading(false);
    };

    fetchPhotos();
  }, []);

  // Filter photos by category
  useEffect(() => {
    if (activeCategory === "all") {
      setFilteredPhotos(photos);
    } else {
      setFilteredPhotos(photos.filter((p) => p.category === activeCategory));
    }
  }, [activeCategory, photos]);

  // Open lightbox
  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
    document.body.style.overflow = "hidden";
  };

  // Close lightbox
  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = "auto";
  };

  // Navigate lightbox
  const nextImage = () => {
    setCurrentImageIndex((prev) =>
      prev < filteredPhotos.length - 1 ? prev + 1 : 0
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) =>
      prev > 0 ? prev - 1 : filteredPhotos.length - 1
    );
  };

  // Keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "Escape") closeLightbox();
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [lightboxOpen, currentImageIndex]);

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#2d2a26] via-[#3d3731] to-[#2d2a26] text-white">
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-24 text-center">
          <h1 className="text-5xl md:text-7xl font-light mb-6">
            Our <span className="text-gradient">Portfolio</span>
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            A collection of our finest moments captured through the lens
          </p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-[#e7e5e4]">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-6">
          <div className="flex flex-wrap gap-3 justify-center">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                  activeCategory === cat.id
                    ? "bg-[#2d2a26] text-white shadow-lg scale-105"
                    : "bg-white border border-[#e7e5e4] text-[#78716c] hover:border-[#c67b5c] hover:text-[#c67b5c]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-16">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-12 h-12 border-4 border-[#c67b5c] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#78716c] mt-4">Loading gallery...</p>
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className="text-center py-20">
            <svg
              className="w-24 h-24 mx-auto text-[#e7e5e4] mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-xl text-[#78716c]">
              No photos in this category yet
            </p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
            {filteredPhotos.map((photo, index) => (
              <div
                key={photo.id}
                onClick={() => openLightbox(index)}
                className="group relative break-inside-avoid cursor-pointer overflow-hidden rounded-2xl bg-[#e7e5e4]/20 transition-all duration-300 hover:shadow-2xl"
              >
                <div className="relative">
                  <Image
                    src={photo.image_url}
                    alt={photo.title}
                    width={800}
                    height={600}
                    className="w-full h-auto transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className="text-lg font-medium">{photo.title}</h3>
                    <p className="text-sm text-white/80 capitalize">
                      {photo.category}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && filteredPhotos[currentImageIndex] && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center">
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>

          {/* Previous Button */}
          {filteredPhotos.length > 1 && (
            <button
              onClick={prevImage}
              className="absolute left-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            >
              <ChevronLeftIcon className="w-8 h-8" />
            </button>
          )}

          {/* Image */}
          <div className="max-w-7xl max-h-[90vh] px-20">
            <Image
              src={filteredPhotos[currentImageIndex].image_url}
              alt={filteredPhotos[currentImageIndex].title}
              width={1920}
              height={1080}
              className="max-w-full max-h-[90vh] w-auto h-auto object-contain"
            />
            <div className="text-center mt-6 text-white">
              <h3 className="text-2xl font-medium mb-2">
                {filteredPhotos[currentImageIndex].title}
              </h3>
              <p className="text-white/60 capitalize">
                {filteredPhotos[currentImageIndex].category} • {currentImageIndex + 1} of{" "}
                {filteredPhotos.length}
              </p>
            </div>
          </div>

          {/* Next Button */}
          {filteredPhotos.length > 1 && (
            <button
              onClick={nextImage}
              className="absolute right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            >
              <ChevronRightIcon className="w-8 h-8" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}