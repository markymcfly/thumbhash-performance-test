// src/components/WrapperImage.tsx
import { useLayoutEffect, useRef, useState } from 'react';
import { thumbHashToDataURL } from 'thumbhash';

const STYLE_ID = 'thumbhash-placeholder-styles';
const injectedHashes = new Set<string>();

function getOrCreateStyleElement(): HTMLStyleElement {
  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement('style');
    el.id = STYLE_ID;
    document.head.appendChild(el);
  }
  return el;
}

function injectThumbHashRule(thumbHash: string, dataUrl: string): void {
  if (injectedHashes.has(thumbHash)) return;
  injectedHashes.add(thumbHash);
  const escapedHash = thumbHash.replace(/\\/g, '\\\\').replace(/"/g, '\\22');
  const safeUrl = dataUrl.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const rule = `.thumb-wrapper[data-thumbhash="${escapedHash}"]::before { background-image: url("${safeUrl}"); }`;
  const styleEl = getOrCreateStyleElement();
  styleEl.sheet?.insertRule(rule, styleEl.sheet.cssRules.length);
}

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

function addLoadedWithRaf(setLoaded: (v: boolean) => void) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => setLoaded(true));
  });
}

export function WrapperImage({ thumbHash, alt, imageUrl, onRenderComplete }: WrapperImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [placeholderUrl, setPlaceholderUrl] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

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

  useLayoutEffect(() => {
    if (placeholderUrl) {
      injectThumbHashRule(thumbHash, placeholderUrl);
    }
  }, [thumbHash, placeholderUrl]);

  useLayoutEffect(() => {
    if (!imageUrl) return;
    const img = imgRef.current;
    if (img?.complete && img.naturalHeight !== 0) {
      addLoadedWithRaf(setLoaded);
    }
  }, [imageUrl, placeholderUrl]);

  const handleImageLoad = () => {
    addLoadedWithRaf(setLoaded);
  };

  return (
    <div
      className={`thumb-wrapper aspect-[4/3] ${loaded ? 'loaded' : ''}`}
      data-thumbhash={thumbHash}
    >
      {imageUrl ? (
        <img
          ref={imgRef}
          className="thumb-image"
          src={imageUrl}
          alt={alt}
          loading="lazy"
          onLoad={handleImageLoad}
        />
      ) : null}
    </div>
  );
}
