'use client';

import Image from 'next/image';
import { useState } from 'react';
import { FaImage } from 'react-icons/fa';

interface OptimizedImageProps {
  src?: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallbackSrc?: string;
  priority?: boolean;
  fill?: boolean;
  objectFit?: 'contain' | 'cover' | 'fill' | 'scale-down';
  objectPosition?: string;
}

/**
 * Optimized image component with fallback support
 * Uses Next.js Image for automatic optimization
 */
export default function OptimizedImage({
  src,
  alt,
  width = 200,
  height = 200,
  className = '',
  fallbackSrc,
  priority = false,
  fill = false,
  objectFit = 'contain',
  objectPosition = 'center',
}: OptimizedImageProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Use fallback if main src fails or is not provided
  const imageSrc = error || !src ? fallbackSrc : src;

  if (!imageSrc) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded ${className}`}
        style={{ width: fill ? '100%' : width, height: fill ? '100%' : height }}
      >
        <FaImage className="text-gray-400 dark:text-gray-600" size={32} />
      </div>
    );
  }

  // Check if it's a data URL (base64)
  const isDataUrl = imageSrc.startsWith('data:');

  return (
    <div
      className={`relative overflow-hidden rounded ${className}`}
      style={{
        width: fill ? '100%' : width,
        height: fill ? '100%' : height,
      }}
    >
      {loading && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 animate-pulse" />
      )}

      {isDataUrl ? (
        // For data URLs, use regular img tag
        <img
          src={imageSrc}
          alt={alt}
          className="w-full h-full object-cover"
          style={{ objectFit, objectPosition }}
          onError={() => setError(true)}
          onLoad={() => setLoading(false)}
        />
      ) : (
        // For regular URLs, use Next.js Image for optimization
        <Image
          src={imageSrc}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          fill={fill}
          priority={priority}
          className="object-cover"
          style={{ objectFit, objectPosition }}
          onError={() => {
            setError(true);
            setLoading(false);
          }}
          onLoadingComplete={() => setLoading(false)}
          sizes={fill ? '100vw' : undefined}
        />
      )}
    </div>
  );
}
