import Image from "next/image";

interface OptimizedImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  width?: number;
  height?: number;
  quality?: number;
  sizes?: string;
  onClick?: () => void;
  onLoad?: () => void;
  draggable?: boolean;
}

/**
 * OptimizedImage component that uses Cloudinary's optimization
 * instead of Next.js image optimization to avoid timeout issues
 */
export default function OptimizedImage({
  src,
  alt,
  fill = false,
  className = "",
  priority = false,
  width,
  height,
  quality = 80,
  sizes,
  onClick,
  onLoad,
  draggable = true,
}: OptimizedImageProps) {
  // Check if this is a Cloudinary image
  const isCloudinary = src.includes('cloudinary.com');

  // For Cloudinary images, use their URL transformation API
  const optimizedSrc = isCloudinary
    ? src.replace('/upload/', `/upload/q_${quality},f_auto/`)
    : src;

  // For very large Cloudinary images, bypass Next.js Image optimization
  if (isCloudinary) {
    return (
      <img
        src={optimizedSrc}
        alt={alt}
        className={className}
        onClick={onClick}
        onLoad={onLoad}
        draggable={draggable}
        style={
          fill
            ? {
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }
            : width && height
            ? { width, height }
            : undefined
        }
        loading={priority ? 'eager' : 'lazy'}
      />
    );
  }

  // For non-Cloudinary images, use Next.js Image
  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      className={className}
      priority={priority}
      width={width}
      height={height}
      quality={quality}
      sizes={sizes}
      onClick={onClick}
      onLoad={onLoad}
      draggable={draggable}
    />
  );
}