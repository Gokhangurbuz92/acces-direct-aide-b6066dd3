import { useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * ⚡ LazyImage — Optimized image component with native lazy loading
 *
 * Features:
 * - Native browser `loading="lazy"` for deferred offscreen loading
 * - Skeleton pulse placeholder while loading
 * - Graceful fallback on load error
 * - Smooth fade-in transition on load
 *
 * @param {{ src: string, alt: string, className?: string, fallbackText?: string, [key: string]: any }} props
 */
export default function LazyImage({ src, alt, className, fallbackText = 'Image indisponible', ...props }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className={cn('relative overflow-hidden bg-slate-100', !loaded && !error && 'animate-pulse', className)}>
      <img
        src={error ? `https://placehold.co/400x300/e2e8f0/64748b?text=${encodeURIComponent(fallbackText)}` : src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (!error) setError(true);
        }}
        className={cn(
          'h-full w-full object-cover transition-opacity duration-300',
          loaded || error ? 'opacity-100' : 'opacity-0',
        )}
        {...props}
      />
    </div>
  );
}
