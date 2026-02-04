// src/components/WrapperImage.tsx
import { useLayoutEffect, useState } from 'react';
import { thumbHashToDataURL } from 'thumbhash';

interface WrapperImageProps {
  thumbHash: string;
  alt: string;
  imageUrl?: string;
  onRenderComplete?: (time: number) => void;
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function WrapperImage({ thumbHash, alt, imageUrl, onRenderComplete }: WrapperImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [placeholderUrl, setPlaceholderUrl] = useState<string | null>(null);

  useLayoutEffect(() => {
    const start = performance.now();
    try {
      const bytes = base64ToBytes(thumbHash);
      const dataUrl = thumbHashToDataURL(bytes);
      const renderTime = performance.now() - start;
      onRenderComplete?.(renderTime);
      queueMicrotask(() => setPlaceholderUrl(dataUrl));
    } catch (error) {
      console.warn('ThumbHash conversion failed:', error);
    }
  }, [thumbHash, onRenderComplete]);

  return (
    <div
      className="relative aspect-[4/3] overflow-hidden bg-gray-200"
      style={{
        '--placeholder-url': placeholderUrl ? `url(${placeholderUrl})` : 'none',
      } as React.CSSProperties}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'var(--placeholder-url)',
          backgroundSize: 'cover',
          filter: 'blur(20px)',
          transform: 'scale(1.1)',
          opacity: isLoaded ? 0 : 1,
          transition: 'opacity 300ms',
        }}
      />

      {imageUrl && (
        <img
          src={imageUrl}
          alt={alt}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: isLoaded ? 1 : 0, transition: 'opacity 300ms' }}
        />
      )}
    </div>
  );
}