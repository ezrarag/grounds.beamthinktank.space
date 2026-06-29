'use client'

import { useState } from 'react'
import { heroImage, type MediaSource } from '@/lib/media'
import { cn } from '@/lib/utils'

/**
 * Front-end media display: renders a property's hero image with a graceful
 * gradient fallback. Shared by the public cards and the admin preview so the
 * back end always shows exactly what the front end renders.
 */
export function PropertyMedia({
  source,
  alt,
  className,
}: {
  source: MediaSource
  alt: string
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  const url = heroImage(source)

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-[radial-gradient(circle_at_30%_20%,#3d6c57_0%,#16322b_45%,#0b1712_100%)]',
        className,
      )}
    >
      {url && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={alt}
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/30">No image</span>
        </div>
      )}
    </div>
  )
}
