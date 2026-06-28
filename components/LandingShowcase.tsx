'use client'

import { useCallback, useEffect, useRef, useState, type TouchEvent } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { showcaseProperties, type ShowcaseProperty } from '@/lib/landingShowcase'
import { cn } from '@/lib/utils'

const SWIPE_THRESHOLD = 40

function pad(n: number) {
  return String(n + 1).padStart(2, '0')
}

export function LandingShowcase({
  properties = showcaseProperties,
}: {
  properties?: ShowcaseProperty[]
}) {
  const [index, setIndex] = useState(0)
  const [failed, setFailed] = useState<Record<string, boolean>>({})
  const touchStartX = useRef<number | null>(null)

  const count = properties.length
  const property = properties[index]

  const go = useCallback(
    (delta: number) => setIndex((current) => (current + delta + count) % count),
    [count],
  )

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'ArrowLeft') go(-1)
      if (event.key === 'ArrowRight') go(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go])

  function handleTouchStart(event: TouchEvent<HTMLElement>) {
    touchStartX.current = event.touches[0]?.clientX ?? null
  }

  function handleTouchEnd(event: TouchEvent<HTMLElement>) {
    if (touchStartX.current === null) return
    const delta = (event.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current
    if (delta > SWIPE_THRESHOLD) go(-1)
    else if (delta < -SWIPE_THRESHOLD) go(1)
    touchStartX.current = null
  }

  if (!property) return null

  return (
    <section
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative h-[100dvh] w-full overflow-hidden bg-[#07100c]"
    >
      {/* Background visual */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#3d6c57_0%,#16322b_45%,#0b1712_100%)]" />
      {property.imageUrl && !failed[property.id] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={property.id}
          src={property.imageUrl}
          alt={property.name}
          onError={() => setFailed((current) => ({ ...current, [property.id]: true }))}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/55" />

      {/* Brand (header is dissolved on the landing page) */}
      <Link
        href="/"
        className="absolute left-5 top-5 font-mono text-[11px] uppercase tracking-[0.28em] text-white/80 sm:left-8 sm:top-7"
      >
        BEAM Grounds
      </Link>

      {/* Counter */}
      {count > 1 ? (
        <p className="absolute right-5 top-5 font-mono text-[11px] tracking-[0.2em] text-white/55 sm:right-8 sm:top-7">
          {pad(index)} <span className="text-white/30">/ {pad(count - 1)}</span>
        </p>
      ) : null}

      {/* Simplified content: city, title, link */}
      <div className="absolute inset-x-0 bottom-0 px-5 pb-16 sm:px-10 sm:pb-20">
        <div className="mx-auto max-w-4xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-beam-gold">{property.city}</p>
          <h1 className="mt-3 font-display text-4xl leading-[1.05] text-white drop-shadow-sm sm:text-6xl">
            {property.name}
          </h1>
          <Link
            href={property.href}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/95 px-5 py-3 text-sm font-semibold text-[#0b1712] transition hover:bg-white"
          >
            View on Properties
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* Prev / next */}
      {count > 1 ? (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous property"
            className="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full border border-white/20 bg-black/30 p-2.5 text-white backdrop-blur-md transition hover:bg-black/55 sm:flex"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next property"
            className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full border border-white/20 bg-black/30 p-2.5 text-white backdrop-blur-md transition hover:bg-black/55 sm:flex"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Dots */}
          <div className="absolute inset-x-0 bottom-7 flex items-center justify-center gap-2">
            {properties.map((item, itemIndex) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setIndex(itemIndex)}
                aria-label={`Go to ${item.name}`}
                aria-current={itemIndex === index}
                className={cn(
                  'h-2 rounded-full transition-all',
                  itemIndex === index ? 'w-6 bg-white' : 'w-2 bg-white/40 hover:bg-white/70',
                )}
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  )
}
