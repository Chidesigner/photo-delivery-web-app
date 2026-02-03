"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useCallback } from "react";
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

type Invoice = {
  id: string;
  invoice_number: string;
  client_name: string;
  client_email: string;
  service_description: string;
  subtotal: number;
  tax_percentage: number;
  tax_amount: number;
  discount_percentage: number;
  discount_amount: number;
  total: number;
  payment_status: string;
  amount_paid: number;
  payment_method: string | null;
  notes: string | null;
  due_date: string | null;
  issue_date: string;
};

// Cloudinary URL transformer helper
const getCloudinaryUrl = (url: string, transformation: string) => {
  if (!url || !url.includes('cloudinary.com')) return url;
  
  // Insert transformation after '/upload/'
  return url.replace('/upload/', `/upload/${transformation}/`);
};

// Get optimized thumbnail
const getThumbnailUrl = (url: string) => {
  return getCloudinaryUrl(url, 'w_800,h_800,c_limit,q_auto,f_auto');
};

// Get full quality image
const getFullQualityUrl = (url: string) => {
  return getCloudinaryUrl(url, 'q_auto,f_auto');
};

// Get hero image (larger but still optimized)
const getHeroUrl = (url: string) => {
  return getCloudinaryUrl(url, 'w_1920,h_1080,c_limit,q_auto:good,f_auto');
};

export default function ClientGalleryViewPage() {
  const { galleryId } = useParams<{ galleryId: string }>();

  const [gallery, setGallery] = useState<Gallery | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isSlideshow, setIsSlideshow] = useState(false);
  const [imageLoaded, setImageLoaded] = useState<{ [key: number]: boolean }>({});
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [viewerLoaded, setViewerLoaded] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  
  // New state for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const photosPerPage = 20;

  const slideshowInterval = useRef<number | null>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const activePhoto = activeIndex !== null ? photos[activeIndex] : null;

  /* Load gallery + photos + invoice */
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

      // Fetch invoice
      const { data: invoiceData } = await supabase
        .from("invoices")
        .select("*")
        .eq("gallery_id", galleryId)
        .maybeSingle();

      if (invoiceData) {
        setInvoice(invoiceData);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load gallery");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (galleryId) loadGallery();
  }, [galleryId]);

  // Calculate pagination
  const totalPages = Math.ceil(photos.length / photosPerPage);
  const startIndex = (currentPage - 1) * photosPerPage;
  const endIndex = startIndex + photosPerPage;

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // Preload adjacent images in lightbox
  useEffect(() => {
    if (activeIndex === null) return;

    // Preload next and previous images
    const preloadIndexes = [activeIndex - 1, activeIndex + 1].filter(
      i => i >= 0 && i < photos.length
    );

    preloadIndexes.forEach(i => {
      const img = new window.Image();
      img.src = getFullQualityUrl(photos[i].image_url);
    });
  }, [activeIndex, photos]);

  /* Download logic */
  const downloadPhoto = async (photo: Photo) => {
    if (!gallery?.paid) {
      toast("Oops! you have a pending payment. Kindly complete payment to download photos", {
        icon: "🔒",
        duration: 4000,
        style: {
          background: '#2d2a26',
          color: '#fff',
          borderRadius: '12px',
        }
      });
      return;
    }

    if (downloadingId === photo.id) return;
    setDownloadingId(photo.id);

    try {
      const response = await fetch(getFullQualityUrl(photo.image_url));
      const blob = await response.blob();
      saveAs(blob, photo.name);
      toast.success("Download started", {
        style: {
          background: '#059669',
          color: '#fff',
          borderRadius: '12px',
        }
      });
    } catch {
      toast.error("Failed to download photo");
    } finally {
      setDownloadingId(null);
    }
  }; 

  const downloadSelected = async () => {
    if (!gallery?.paid) {
      toast("Oops! you have a pending payment. Kindly complete payment to download photos", {
        icon: "🔒",
        duration: 4000,
        style: {
          background: '#2d2a26',
          color: '#fff',
          borderRadius: '12px',
        }
      });
      return;
    }

    if (selectedPhotos.size === 0) return;

    const selectedPhotosList = photos.filter(p => selectedPhotos.has(p.id));

    setIsZipping(true);
    toast.loading("Preparing download...", {
      id: "zip",
      style: {
        background: '#2d2a26',
        color: '#fff',
        borderRadius: '12px',
      }
    });
    const zip = new JSZip();
    const folder = zip.folder("selected_photos");

    try {
      for (const photo of selectedPhotosList) {
        const response = await fetch(getFullQualityUrl(photo.image_url));
        const blob = await response.blob();
        folder?.file(photo.name, blob);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, `selected_photos.zip`);
      toast.success("Download complete!", {
        id: "zip",
        style: {
          background: '#059669',
          color: '#fff',
          borderRadius: '12px',
        }
      });
      setSelectedPhotos(new Set());
      setSelectionMode(false);
    } catch {
      toast.error("Failed to download photos", { id: "zip" });
    } finally {
      setIsZipping(false);
    }
  };

  const downloadAll = async () => {
    if (!gallery?.paid) {
      toast("Oops! you have a pending payment. Kindly complete payment to download photos", {
        icon: "🔒",
        duration: 4000,
        style: {
          background: '#2d2a26',
          color: '#fff',
          borderRadius: '12px',
        }
      });
      return;
    }

    if (photos.length === 0) return;

    setIsZipping(true);
    toast.loading("Preparing download...", {
      id: "zip",
      style: {
        background: '#2d2a26',
        color: '#fff',
        borderRadius: '12px',
      }
    });
    const zip = new JSZip();
    const folder = zip.folder(gallery.event_name || "gallery");

    try {
      for (const photo of photos) {
        const response = await fetch(getFullQualityUrl(photo.image_url));
        const blob = await response.blob();
        folder?.file(photo.name, blob);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, `${gallery.event_name || "gallery"}.zip`);
      toast.success("Download complete!", {
        id: "zip",
        style: {
          background: '#059669',
          color: '#fff',
          borderRadius: '12px',
        }
      });
    } catch {
      toast.error("Failed to download gallery", { id: "zip" });
    } finally {
      setIsZipping(false);
    }
  };

  /* Invoice Download */
  const downloadInvoice = () => {
    if (!invoice) return;
    setDownloadingInvoice(true);
    try {
      const invoiceContent = `
================================================================================
                              INVOICE
================================================================================

Invoice Number: ${invoice.invoice_number}
Issue Date: ${new Date(invoice.issue_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
${invoice.due_date ? `Due Date: ${new Date(invoice.due_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}` : ''}

--------------------------------------------------------------------------------
BILL TO
--------------------------------------------------------------------------------
${invoice.client_name}
${invoice.client_email}

--------------------------------------------------------------------------------
SERVICE DESCRIPTION
--------------------------------------------------------------------------------
${invoice.service_description}

--------------------------------------------------------------------------------
PAYMENT DETAILS
--------------------------------------------------------------------------------
Subtotal:                                                    ₦${invoice.subtotal.toLocaleString()}
${invoice.tax_percentage > 0 ? `Tax (${invoice.tax_percentage}%):                                                  ₦${invoice.tax_amount.toLocaleString()}` : ''}
${invoice.discount_percentage > 0 ? `Discount (${invoice.discount_percentage}%):                                             -₦${invoice.discount_amount.toLocaleString()}` : ''}
--------------------------------------------------------------------------------
TOTAL:                                                       ₦${invoice.total.toLocaleString()}
--------------------------------------------------------------------------------

Payment Status: ${invoice.payment_status.toUpperCase()}
Amount Paid: ₦${invoice.amount_paid.toLocaleString()}
Balance Due: ₦${(invoice.total - invoice.amount_paid).toLocaleString()}
${invoice.payment_method ? `Payment Method: ${invoice.payment_method}` : ''}

${invoice.notes ? `\nNotes:\n${invoice.notes}` : ''}

================================================================================
                         Thank you for your business!
================================================================================
`;

      const blob = new Blob([invoiceContent], { type: 'text/plain' });
      saveAs(blob, `Invoice-${invoice.invoice_number}.txt`);
      toast.success("Invoice downloaded!", {
        style: {
          background: '#059669',
          color: '#fff',
          borderRadius: '12px',
        }
      });
    } finally {
      setDownloadingInvoice(false);
    }
  }; 

  /* Selection */
  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      return newSet;
    });
  };

  /* Navigation */
  const openViewer = (index: number, slideshow = false) => {
    setViewerLoaded(false);
    setActiveIndex(index);
    setIsSlideshow(slideshow);
  };

  const closeViewer = () => {
    setActiveIndex(null);
    setIsSlideshow(false);
    resetZoom();
  };

  /* Zoom and Pan Functions */
  const resetZoom = () => {
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
    setIsDragging(false);
  };

  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 3));
  };

  const zoomOut = () => {
    setZoomLevel(prev => {
      const newZoom = Math.max(prev - 0.5, 1);
      if (newZoom === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newZoom;
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (zoomLevel > 1 && e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && zoomLevel > 1 && e.touches.length === 1) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const nextPhoto = () => {
    resetZoom();
    setActiveIndex((prev) =>
      prev !== null && prev < photos.length - 1 ? prev + 1 : prev
    );
  };

  const prevPhoto = () => {
    resetZoom();
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

  // Reset viewer loading state when switching images in the lightbox
  useEffect(() => {
    setViewerLoaded(false);
  }, [activeIndex]);

  /* Payment Status Badge */
  const getPaymentBadge = () => {
    if (!invoice) return null;

    const statusColors = {
      paid: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      partial: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      unpaid: "bg-red-500/10 text-red-600 border-red-500/20"
    };

    const statusLabels = {
      paid: "Paid",
      partial: "Partially Paid",
      unpaid: "Payment Due"
    };

    const status = invoice.payment_status as keyof typeof statusColors;

    return (
      <span className={`px-3 py-1 text-xs font-medium rounded-full border ${statusColors[status] || statusColors.unpaid}`}>
        {statusLabels[status] || "Payment Due"}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-8">
            <div className="absolute inset-0 border-4 border-[#e7e5e4] rounded-full" />
            <div className="absolute inset-0 border-4 border-transparent border-t-[#c67b5c] rounded-full animate-spin" />
          </div>
          <p className="text-[#78716c] text-lg font-light tracking-wide">Preparing your gallery...</p>
        </div>
      </div>
    );
  }

  if (!gallery) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#fafaf9]">
        <div className="max-w-md w-full p-12 border border-[#e7e5e4] rounded-3xl bg-white shadow-xl text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#c67b5c]/20 to-[#8b9e87]/20 flex items-center justify-center mx-auto mb-8">
            <svg className="w-10 h-10 text-[#c67b5c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-4xl font-light text-[#1c1917] mb-4">Gallery Not Found</h1>
          <p className="text-[#78716c] leading-relaxed text-lg">This gallery may have been removed or the link is incorrect.</p>
        </div>
      </div>
    );
  }

  // Get visible photos for current page
  const visiblePhotos = photos.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* IMMERSIVE HERO SECTION */}
      {photos.length > 0 && (
        <div className="relative h-screen w-full flex items-center justify-center overflow-hidden">
          {/* Hero Background - Using optimized hero image */}
          <div className="absolute inset-0">
            <Image
              src={getHeroUrl(photos[0].image_url)}
              alt={gallery.event_name}
              fill
              className="object-cover scale-105"
              priority
              quality={85}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/80" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 text-center text-white px-8 max-w-5xl mx-auto">
            <div className="animate-slide-up space-y-6">
              {/* Date Badge */}
              {gallery.event_date && (
                <div className="inline-flex items-center gap-2 px-5 py-2 glass-dark rounded-full text-white/90 text-sm font-light tracking-wider">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(gallery.event_date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              )}

              {/* Event Title - Responsive Type */}
              <h1 className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-light leading-tight sm:leading-none tracking-tight">
                {gallery.event_name}
              </h1>

              {/* Photo Count */}
              <p className="text-xl md:text-2xl font-light text-white/70 tracking-wide">
                {photos.length} {photos.length === 1 ? 'Memory' : 'Memories'} Captured
              </p>

              {/* Action Buttons - Mobile Stack */}
              <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 pt-6 sm:pt-8 w-full max-w-sm mx-auto sm:max-w-none">
                <button
                  onClick={() => openViewer(0, false)}
                  className="group px-6 sm:px-10 py-3.5 sm:py-4 bg-white text-[#2d2a26] rounded-xl sm:rounded-2xl font-medium transition-all duration-500 hover:scale-105 shadow-2xl flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  View Gallery
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => openViewer(0, true)}
                  className="px-6 sm:px-10 py-3.5 sm:py-4 glass-dark border border-white/20 text-white rounded-xl sm:rounded-2xl font-medium transition-all duration-500 hover:bg-white/10 hover:scale-105 flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Play Slideshow
                </button>
              </div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 text-white/60">
            <span className="text-sm font-light tracking-widest uppercase">Scroll to explore</span>
            <div className="w-px h-12 bg-gradient-to-b from-white/60 to-transparent animate-pulse" />
          </div>
        </div>
      )}

      {/* PREMIUM STICKY TOOLBAR - Mobile Optimized */}
      <div className="sticky top-0 z-40 glass border-b border-[#e7e5e4]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            {/* Left side - Photo count and status */}
            <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-5">
              <h2 className="text-lg sm:text-xl font-light text-[#1c1917]">
                <span className="text-[#c67b5c] font-medium">{photos.length}</span> {photos.length === 1 ? 'Photo' : 'Photos'}
              </h2>
              <div className="flex items-center gap-2">
                {selectionMode && (
                  <span className="text-xs sm:text-sm text-[#78716c] bg-[#fafaf9] px-3 py-1 rounded-full">
                    {selectedPhotos.size} selected
                  </span>
                )}
                {getPaymentBadge()}
              </div>
            </div>

            {/* Right side - Action buttons */}
            <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0">
              {/* Invoice Button */}
              {invoice && (
                <button
                  onClick={() => setShowInvoiceModal(true)}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-white border border-[#e7e5e4] text-[#2d2a26] rounded-lg sm:rounded-xl hover:bg-[#fafaf9] hover:border-[#c67b5c] transition-all duration-300 text-sm whitespace-nowrap flex-shrink-0"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="hidden xs:inline">Invoice</span>
                </button>
              )}

              {selectionMode ? (
                <>
                  <button
                    onClick={downloadSelected}
                    disabled={selectedPhotos.size === 0 || isZipping}
                    className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-[#c67b5c] text-white rounded-lg sm:rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap flex-shrink-0"
                  >
                    {isZipping ? (
                      <>
                        <div className="w-4 h-4 relative">
                          <div className="absolute inset-0 border-2 border-transparent border-t-white rounded-full animate-spin" />
                        </div>
                        <span>Preparing...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download ({selectedPhotos.size})
                      </>
                    )}
                  </button> 
                  <button
                    onClick={() => {
                      setSelectionMode(false);
                      setSelectedPhotos(new Set());
                    }}
                    className="px-3 sm:px-5 py-2 sm:py-2.5 bg-white border border-[#e7e5e4] text-[#2d2a26] rounded-lg sm:rounded-xl hover:bg-[#fafaf9] transition-all duration-300 text-sm whitespace-nowrap flex-shrink-0"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setSelectionMode(true)}
                    className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-white border border-[#e7e5e4] text-[#2d2a26] rounded-lg sm:rounded-xl hover:bg-[#fafaf9] hover:border-[#c67b5c] transition-all duration-300 text-sm whitespace-nowrap flex-shrink-0"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Select
                  </button>
                  <button
                    onClick={downloadAll}
                    disabled={isZipping}
                    className="group flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-[#2d2a26] text-white rounded-lg sm:rounded-xl transition-all duration-300 shadow-lg text-sm whitespace-nowrap flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isZipping ? (
                      <>
                        <div className="w-4 h-4 relative">
                          <div className="absolute inset-0 border-2 border-transparent border-t-white rounded-full animate-spin" />
                        </div>
                        <span>Preparing...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download All
                      </>
                    )}
                  </button> 
                </>
              )}
            </div>
          </div>
        </div>
      </div>


      {/* PREMIUM MASONRY GALLERY - Pixieset Style with Progressive Loading */}
      <div className="max-w-[1800px] mx-auto px-6 md:px-12 py-16">
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-5 space-y-5">
          {visiblePhotos.map((photo, i) => {
            const isSelected = selectedPhotos.has(photo.id);
            const actualIndex = startIndex + i; // Get the actual index in the full photos array

            return (
              <div
                key={photo.id}
                className={`relative group break-inside-avoid cursor-pointer transition-all duration-500 ${imageLoaded[actualIndex] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  } ${isSelected && selectionMode ? 'ring-4 ring-[#c67b5c] ring-offset-4 rounded-xl' : ''}`}
                onClick={() => {
                  if (selectionMode) {
                    togglePhotoSelection(photo.id);
                  } else {
                    openViewer(actualIndex, false);
                  }
                }}
                style={{ transitionDelay: `${Math.min(i * 50, 500)}ms` }}
              >
                {/* Photo Container with Skeleton */}
                <div className="relative overflow-hidden rounded-xl bg-[#e7e5e4] shadow-md hover:shadow-2xl transition-all duration-500">
                  {/* Skeleton loader */}
                  {!imageLoaded[actualIndex] && (
                    <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-[#e7e5e4] via-[#d6d3d1] to-[#e7e5e4] bg-[length:200%_100%]" 
                         style={{ animation: 'shimmer 1.5s infinite' }} />
                  )}
                  
                  <Image
                    src={getThumbnailUrl(photo.image_url)}
                    alt={photo.name}
                    width={800}
                    height={600}
                    className="w-full h-auto transition-transform duration-700 ease-out group-hover:scale-105"
                    onLoad={() => setImageLoaded(prev => ({ ...prev, [actualIndex]: true }))}
                    loading="lazy"
                    quality={80}
                  />

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />

                  {/* Selection Checkbox */}
                  {selectionMode && (
                    <div className="absolute top-3 left-3 z-20">
                      <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${isSelected
                        ? 'bg-[#c67b5c] border-[#c67b5c] shadow-lg'
                        : 'bg-white/90 border-white backdrop-blur-sm shadow-md'
                        }`}>
                        {isSelected && (
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Download Button */}
                  {!selectionMode && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadPhoto(photo);
                      }}
                      disabled={downloadingId === photo.id}
                      title={downloadingId === photo.id ? 'Preparing download...' : 'Download'}
                      className={`absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/95 backdrop-blur-sm text-[#2d2a26] p-2.5 rounded-lg shadow-lg ${downloadingId === photo.id ? 'cursor-wait opacity-100 scale-100' : 'hover:bg-white hover:scale-110'}`}
                    >
                      {downloadingId === photo.id ? (
                        <div className="w-5 h-5 relative">
                          <div className="absolute inset-0 border-2 border-transparent border-t-[#c67b5c] rounded-full animate-spin" />
                        </div>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      )}
                    </button>
                  )} 

                  {/* Photo Number */}
                  <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <span className="text-white text-xs font-medium bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
                      {actualIndex + 1} / {photos.length}
                    </span>
                  </div>

                  {/* Expand Icon */}
                  <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="bg-black/60 backdrop-blur-sm p-2 rounded-full">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Elegant Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col items-center gap-6 py-12 mt-8">
            {/* Page Info */}
            <div className="flex items-center gap-3 text-[#78716c] text-sm font-light">
              <div className="w-12 h-px bg-[#e7e5e4]" />
              <span>
                Page {currentPage} of {totalPages} • Showing {startIndex + 1}-{Math.min(endIndex, photos.length)} of {photos.length}
              </span>
              <div className="w-12 h-px bg-[#e7e5e4]" />
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-3">
              {/* Previous Button */}
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="group flex items-center gap-2 px-6 py-3 bg-white border border-[#e7e5e4] text-[#2d2a26] rounded-xl hover:bg-[#fafaf9] hover:border-[#c67b5c] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-[#e7e5e4] shadow-sm"
              >
                <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1 group-disabled:translate-x-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium">Previous</span>
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                  // Show first page, last page, current page, and pages around current
                  const showPage = 
                    pageNum === 1 || 
                    pageNum === totalPages || 
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1);
                  
                  // Show ellipsis
                  const showEllipsisBefore = pageNum === currentPage - 2 && currentPage > 3;
                  const showEllipsisAfter = pageNum === currentPage + 2 && currentPage < totalPages - 2;

                  if (showEllipsisBefore || showEllipsisAfter) {
                    return (
                      <span key={pageNum} className="px-2 text-[#78716c]">
                        •••
                      </span>
                    );
                  }

                  if (!showPage) return null;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 rounded-lg font-medium transition-all duration-300 ${
                        currentPage === pageNum
                          ? 'bg-[#c67b5c] text-white shadow-lg scale-110'
                          : 'bg-white border border-[#e7e5e4] text-[#2d2a26] hover:bg-[#fafaf9] hover:border-[#c67b5c]'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              {/* Next Button */}
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="group flex items-center gap-2 px-6 py-3 bg-white border border-[#e7e5e4] text-[#2d2a26] rounded-xl hover:bg-[#fafaf9] hover:border-[#c67b5c] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-[#e7e5e4] shadow-sm"
              >
                <span className="font-medium">Next</span>
                <svg className="w-5 h-5 transition-transform group-hover:translate-x-1 group-disabled:translate-x-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Quick Jump (optional - only show if many pages) */}
            {totalPages > 5 && (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-[#78716c]">Jump to page:</span>
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const page = parseInt(e.target.value);
                    if (page >= 1 && page <= totalPages) {
                      setCurrentPage(page);
                    }
                  }}
                  className="w-16 px-3 py-2 border border-[#e7e5e4] rounded-lg text-center focus:outline-none focus:border-[#c67b5c] transition-colors"
                />
              </div>
            )}
          </div>
        )}
      </div>


      {/* ELEGANT FOOTER */}
      <footer className="py-20 px-6 bg-gradient-to-br from-[#2d2a26] to-[#1c1917] text-white">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="w-20 h-px bg-gradient-to-r from-transparent via-[#c67b5c] to-transparent mx-auto" />

          <h3 className="text-4xl md:text-5xl font-light">
            Thank you for choosing us
          </h3>

          <p className="text-white/60 text-lg font-light max-w-2xl mx-auto leading-relaxed">
            We hope these photos bring you joy for years to come. It was an honor to capture your special moments.
          </p>

          <div className="pt-8">
            <p className="text-white/40 text-sm tracking-wider uppercase">
              Photography by A2Studios
            </p>
          </div>
        </div>
      </footer>

      {/* INVOICE MODAL */}
      {showInvoiceModal && invoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
            {/* Modal Header - Compact for mobile */}
            <div className="sticky top-0 bg-white border-b border-[#e7e5e4] p-5 sm:p-8 rounded-t-3xl">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl sm:text-3xl font-light text-[#1c1917] mb-1 sm:mb-2">Invoice</h3>
                  <p className="text-[#78716c] text-sm sm:text-base">#{invoice.invoice_number}</p>
                </div>
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="p-2 sm:p-3 hover:bg-[#fafaf9] rounded-xl transition-colors"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#78716c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content - Responsive padding */}
            <div className="p-5 sm:p-8 space-y-6 sm:space-y-8">
              {/* Status & Dates - Mobile Stack */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#fafaf9] to-white border border-[#e7e5e4]">
                <div className="flex gap-8 sm:block">
                  <div className="mb-0 sm:mb-4">
                    <p className="text-xs text-[#78716c] mb-1">Issue Date</p>
                    <p className="text-sm sm:text-base text-[#1c1917] font-medium">
                      {new Date(invoice.issue_date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  {invoice.due_date && (
                    <div>
                      <p className="text-xs text-[#78716c] mb-1">Due Date</p>
                      <p className="text-sm sm:text-base text-[#1c1917] font-medium">
                        {new Date(invoice.due_date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  )}
                </div>
                <div className="pt-4 sm:pt-0 border-t sm:border-t-0 border-[#e7e5e4]/50">
                  {getPaymentBadge()}
                </div>
              </div>

              {/* Client Info */}
              <div>
                <h4 className="text-sm font-semibold text-[#78716c] uppercase tracking-wider mb-3">Bill To</h4>
                <p className="text-xl text-[#1c1917]">{invoice.client_name}</p>
                <p className="text-[#78716c]">{invoice.client_email}</p>
              </div>

              {/* Service Description */}
              <div>
                <h4 className="text-sm font-semibold text-[#78716c] uppercase tracking-wider mb-3">Service</h4>
                <p className="text-[#1c1917] leading-relaxed">{invoice.service_description}</p>
              </div>

              {/* Pricing Breakdown */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-[#78716c] uppercase tracking-wider">Summary</h4>

                <div className="space-y-3 text-[#1c1917]">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₦{invoice.subtotal.toLocaleString()}</span>
                  </div>

                  {invoice.tax_percentage > 0 && (
                    <div className="flex justify-between text-[#78716c]">
                      <span>Tax ({invoice.tax_percentage}%)</span>
                      <span>₦{invoice.tax_amount.toLocaleString()}</span>
                    </div>
                  )}

                  {invoice.discount_percentage > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount ({invoice.discount_percentage}%)</span>
                      <span>-₦{invoice.discount_amount.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="pt-4 border-t border-[#e7e5e4]">
                    <div className="flex justify-between text-xl font-medium">
                      <span>Total</span>
                      <span className="text-[#c67b5c]">₦{invoice.total.toLocaleString()}</span>
                    </div>
                  </div>

                  {invoice.amount_paid > 0 && (
                    <div className="flex justify-between text-[#78716c]">
                      <span>Amount Paid</span>
                      <span>₦{invoice.amount_paid.toLocaleString()}</span>
                    </div>
                  )}

                  {invoice.total - invoice.amount_paid > 0 && (
                    <div className="flex justify-between font-medium text-red-600">
                      <span>Balance Due</span>
                      <span>₦{(invoice.total - invoice.amount_paid).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {invoice.notes && (
                <div className="p-6 rounded-2xl bg-[#fafaf9] border border-[#e7e5e4]">
                  <h4 className="text-sm font-semibold text-[#78716c] uppercase tracking-wider mb-3">Notes</h4>
                  <p className="text-[#1c1917] leading-relaxed">{invoice.notes}</p>
                </div>
              )}

              {/* Download Button */}
              <button
                onClick={downloadInvoice}
                disabled={downloadingInvoice}
                className={`w-full flex items-center justify-center gap-3 px-8 py-4 bg-[#2d2a26] text-white rounded-2xl transition-all duration-300 font-medium shadow-lg ${downloadingInvoice ? 'cursor-wait' : 'hover:bg-[#3d3731] hover:scale-[1.02]'}`}
              >
                {downloadingInvoice ? (
                  <>
                    <div className="w-5 h-5 relative">
                      <div className="absolute inset-0 border-2 border-transparent border-t-white rounded-full animate-spin" />
                    </div>
                    <span>Preparing...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Invoice
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LUXURY LIGHTBOX */}
      {activePhoto && (
        <div className="fixed inset-0 z-50 bg-black">
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Close button */}
            <button
              onClick={closeViewer}
              className="absolute top-6 right-6 text-white/70 hover:text-white p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all duration-300 z-50 backdrop-blur-sm"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Slideshow indicator */}
            {isSlideshow && (
              <div className="absolute top-6 left-6 flex items-center gap-3 px-5 py-3 bg-white/10 backdrop-blur-sm rounded-2xl text-white/90 z-50">
                <div className="w-2 h-2 rounded-full bg-[#c67b5c] animate-pulse" />
                <span className="text-sm font-light tracking-wide">Slideshow</span>
                <button
                  onClick={() => setIsSlideshow(false)}
                  className="ml-2 text-white/60 hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Navigation - Previous */}
            {activeIndex! > 0 && (
              <button
                onClick={prevPhoto}
                className="absolute left-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-5 bg-white/5 hover:bg-white/10 rounded-2xl transition-all duration-300 z-50 backdrop-blur-sm"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* Navigation - Next */}
            {activeIndex! < photos.length - 1 && (
              <button
                onClick={nextPhoto}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-5 bg-white/5 hover:bg-white/10 rounded-2xl transition-all duration-300 z-50 backdrop-blur-sm"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {/* Zoom Controls */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-3 bg-white/10 backdrop-blur-sm rounded-2xl z-50">
              <button
                onClick={zoomOut}
                disabled={zoomLevel <= 1}
                className="text-white/70 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Zoom Out"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                </svg>
              </button>
              
              <div className="px-3 py-1 text-white/90 text-sm font-medium min-w-[60px] text-center">
                {Math.round(zoomLevel * 100)}%
              </div>
              
              <button
                onClick={zoomIn}
                disabled={zoomLevel >= 3}
                className="text-white/70 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Zoom In"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </button>

              {zoomLevel > 1 && (
                <button
                  onClick={resetZoom}
                  className="ml-2 text-white/70 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-all duration-300"
                  title="Reset Zoom"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              )}
            </div>

            {/* Main Image - With Zoom and Pan - Using full quality */}

            {/* Show loading overlay until the full image finishes loading */}
            {!viewerLoaded && (
              <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div className="relative w-20 h-20 mx-auto mb-2">
                    <div className="absolute inset-0 border-4 border-white/20 rounded-full" />
                    <div className="absolute inset-0 border-4 border-transparent border-t-white rounded-full animate-spin" />
                  </div>
                  <p className="text-white/80 text-sm">Loading image...</p>
                </div>
              </div>
            )}

            <div 
              ref={imageContainerRef}
              className="relative w-full h-full max-w-[90vw] max-h-[85vh] mx-auto overflow-hidden"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{ 
                cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
              }}
            >
              <div
                style={{
                  transform: `scale(${zoomLevel}) translate(${position.x / zoomLevel}px, ${position.y / zoomLevel}px)`,
                  transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                  width: '100%',
                  height: '100%',
                  position: 'relative'
                }}
              >
                <Image
                  src={getFullQualityUrl(activePhoto.image_url)}
                  alt={activePhoto.name}
                  fill
                  className="object-contain pointer-events-none select-none"
                  priority
                  quality={95}
                  draggable={false}
                  onLoadingComplete={() => setViewerLoaded(true)}
                  onError={() => setViewerLoaded(true)}
                />
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 sm:p-10">
              <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div className="text-white space-y-2 flex-1">
                  <p className="text-xs sm:text-sm text-white/50 font-light tracking-wider uppercase">
                    {activeIndex! + 1} of {photos.length}
                  </p>
                  <p className="text-lg sm:text-2xl font-light truncate">{activePhoto.name}</p>
                  {zoomLevel > 1 && (
                    <p className="text-xs text-white/60 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
                      </svg>
                      Drag to pan • Pinch or use buttons to zoom
                    </p>
                  )}
                </div>
                <button
                  onClick={() => downloadPhoto(activePhoto)}
                  disabled={downloadingId === activePhoto.id}
                  className={`w-full sm:w-auto flex items-center justify-center gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-white text-[#2d2a26] rounded-2xl transition-all duration-300 font-medium shadow-2xl ${downloadingId === activePhoto.id ? 'cursor-wait' : 'hover:bg-white/90 hover:scale-105'}`}
                >
                  {downloadingId === activePhoto.id ? (
                    <>
                      <div className="w-5 h-5 relative">
                        <div className="absolute inset-0 border-2 border-transparent border-t-[#c67b5c] rounded-full animate-spin" />
                      </div>
                      <span>Preparing...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download
                    </>
                  )}
                </button> 
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add shimmer animation to global styles */}
      <style jsx global>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </div>
  );
}