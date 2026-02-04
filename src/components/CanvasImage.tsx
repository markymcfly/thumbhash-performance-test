// src/components/CanvasImage.tsx
import { useLayoutEffect, useRef, useState } from 'react';
import { thumbHashToRGBA } from 'thumbhash';

interface CanvasImageProps {
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

export function CanvasImage({ thumbHash, alt, imageUrl, onRenderComplete }: CanvasImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showCanvas, setShowCanvas] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderStartRef = useRef<number>(0);

  useLayoutEffect(() => {
    if (!canvasRef.current) return;

    renderStartRef.current = performance.now();

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', {
      alpha: true,
      willReadFrequently: false
    });

    if (!ctx) return;

    try {
      const bytes = base64ToBytes(thumbHash);
      const { w, h, rgba } = thumbHashToRGBA(bytes);

      canvas.width = w;
      canvas.height = h;

      const imageData = ctx.createImageData(w, h);
      imageData.data.set(rgba);
      ctx.putImageData(imageData, 0, 0);

      const renderTime = performance.now() - renderStartRef.current;
      onRenderComplete?.(renderTime);

    } catch (error) {
      console.warn('ThumbHash rendering failed:', error);
      queueMicrotask(() => setShowCanvas(false));
    }
  }, [thumbHash, onRenderComplete]);

  const handleTransitionEnd = () => {
    if (isLoaded) {
      setShowCanvas(false);
    }
  };

  return (
    <div className="relative aspect-[4/3] overflow-hidden">
      {showCanvas && (
        <canvas
          ref={canvasRef}
          onTransitionEnd={handleTransitionEnd}
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            filter: 'blur(20px)',
            transform: 'scale(1.1)',
            opacity: isLoaded ? 0 : 1,
            transition: 'opacity 300ms ease-out',
          }}
        />
      )}

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