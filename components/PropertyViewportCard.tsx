'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState, type PointerEvent } from 'react'
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coins,
  Globe,
  Lightbulb,
  MapPin,
  MessageSquarePlus,
  Plus,
  Users,
} from 'lucide-react'
import { propertyViewports, type PropertyViewport } from '@/lib/propertyViewport'
import { cn } from '@/lib/utils'

const MAX_TILT = 9 // degrees

// <model-viewer> is a standalone web component loaded on demand (only when a
// property actually has a 3D model), so it never weighs down the base bundle.
const MODEL_VIEWER_SRC =
  'https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': Record<string, unknown>
    }
  }
}

function useModelViewer(enabled: boolean) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return
    if (window.customElements?.get('model-viewer')) return
    if (document.querySelector(`script[data-model-viewer]`)) return

    const script = document.createElement('script')
    script.type = 'module'
    script.src = MODEL_VIEWER_SRC
    script.dataset.modelViewer = 'true'
    document.head.appendChild(script)
  }, [enabled])
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : ''
  return (first + last).toUpperCase()
}

function SourceBadge({ property }: { property: PropertyViewport }) {
  const isExternal = property.source === 'external'
  const body = (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold backdrop-blur-md',
        isExternal
          ? 'border-amber-200/40 bg-amber-300/15 text-amber-50'
          : 'border-emerald-200/40 bg-emerald-300/15 text-emerald-50',
      )}
    >
      <Globe className="h-3.5 w-3.5" aria-hidden="true" />
      {isExternal ? `External · seeded from ${property.sourceLabel}` : 'Internal · Grounds project'}
    </span>
  )

  if (isExternal && property.sourceHref) {
    return (
      <a href={property.sourceHref} className="transition hover:brightness-110" title={`Source: ${property.sourceLabel}`}>
        {body}
      </a>
    )
  }
  return body
}

function ContributorStatus({ property }: { property: PropertyViewport }) {
  const count = property.contributors.length
  const shown = property.contributors.slice(0, 4)

  return (
    <a
      href={property.contributorsHref || '#'}
      title={`${count} people have worked on this project`}
      className="group inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-black/35 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md transition hover:border-white/40 hover:bg-black/50"
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
      </span>
      <span className="flex -space-x-2">
        {shown.map((person) => (
          <span
            key={person.name}
            className="flex h-6 w-6 items-center justify-center rounded-full border border-black/40 bg-grounds-moss text-[10px] font-semibold text-white"
          >
            {initials(person.name)}
          </span>
        ))}
      </span>
      <span className="flex items-center gap-1">
        <Users className="h-3.5 w-3.5" aria-hidden="true" />
        {count} working
      </span>
    </a>
  )
}

export function PropertyViewportCard({
  properties = propertyViewports,
  className,
}: {
  properties?: PropertyViewport[]
  className?: string
}) {
  const [index, setIndex] = useState(0)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  const property = properties[index]
  const hasMany = properties.length > 1
  // When a 3D model is shown it owns pointer drag/zoom, so skip the card tilt.
  const tiltEnabled = !property?.modelUrl

  const handlePointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const px = (event.clientX - rect.left) / rect.width
    const py = (event.clientY - rect.top) / rect.height
    setTilt({ x: (0.5 - py) * MAX_TILT, y: (px - 0.5) * MAX_TILT })
  }, [])

  const resetTilt = useCallback(() => setTilt({ x: 0, y: 0 }), [])

  const go = useCallback(
    (delta: number) => setIndex((current) => (current + delta + properties.length) % properties.length),
    [properties.length],
  )

  if (!property) return null

  return (
    <div className={cn('group/card flex w-full flex-1 flex-col [perspective:1400px]', className)}>
      <div
        onPointerMove={tiltEnabled ? handlePointerMove : undefined}
        onPointerLeave={tiltEnabled ? resetTilt : undefined}
        className="flex flex-1 animate-grounds-float"
      >
        <div
          style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
          className="flex flex-1 flex-col overflow-hidden rounded-[2rem] border border-white/12 bg-[#0e1b15] shadow-grounds transition-transform duration-200 ease-out [transform-style:preserve-3d] motion-reduce:transition-none"
        >
          {/* Visual / future 3D model surface */}
          <div className="relative flex-1 overflow-hidden">
            <PropertyVisual property={property} />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/45" />

            {/* Top row: external-source badge + live collaborator status */}
            <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-3 p-5 sm:p-7 [transform:translateZ(50px)]">
              <span className="pointer-events-auto">
                <SourceBadge property={property} />
              </span>
              <span className="pointer-events-auto">
                <ContributorStatus property={property} />
              </span>
            </div>

            {/* Bottom-left: name overlay */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5 sm:p-7 [transform:translateZ(70px)]">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-white/85 backdrop-blur-md">
                {property.status}
              </span>
              {property.detailHref ? (
                <Link href={property.detailHref} className="pointer-events-auto block">
                  <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-[1.05] tracking-tight text-white drop-shadow-sm transition hover:text-grounds-sand sm:text-4xl lg:text-5xl">
                    {property.name}
                  </h1>
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-white/80">
                    <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {property.address}
                  </p>
                </Link>
              ) : (
                <>
                  <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-[1.05] tracking-tight text-white drop-shadow-sm sm:text-4xl lg:text-5xl">
                    {property.name}
                  </h1>
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-white/80">
                    <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {property.address}
                  </p>
                </>
              )}
            </div>

            {hasMany ? (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label="Previous property"
                  className="absolute left-4 top-1/2 hidden -translate-y-1/2 rounded-full border border-white/20 bg-black/40 p-2 text-white backdrop-blur-md transition hover:bg-black/60 sm:flex [transform:translateZ(60px)]"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label="Next property"
                  className="absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-full border border-white/20 bg-black/40 p-2 text-white backdrop-blur-md transition hover:bg-black/60 sm:flex [transform:translateZ(60px)]"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            ) : null}
          </div>

          {/* Info panel */}
          <div
            className="-mt-10 bg-grounds-mist px-5 pb-6 pt-14 text-[#10231b] sm:px-8 sm:pb-7 sm:pt-16"
            style={{ clipPath: 'polygon(0 10%, 100% 0, 100% 100%, 0 100%)' }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-grounds-moss">
                {property.category}
              </p>
              <p className="text-xs font-medium text-[#10231b]/55">{property.dateLabel}</p>
            </div>

            {property.detailHref ? (
              <Link href={property.detailHref} className="block transition hover:text-grounds-moss">
                <p className="mt-3 max-w-3xl text-sm leading-7 text-[#10231b]/80 sm:text-base">{property.subtitle}</p>
              </Link>
            ) : (
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#10231b]/80 sm:text-base">
                {property.subtitle}
              </p>
            )}

            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              {/* Potential uses + submit idea + NGO relations */}
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#10231b]/60">
                  <Lightbulb className="h-4 w-4 text-grounds-clay" aria-hidden="true" />
                  Potential uses
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {property.potentialUses.map((use) => (
                    <span
                      key={use}
                      className="rounded-full border border-[#10231b]/15 bg-white/60 px-3 py-1 text-xs font-medium text-[#10231b]/80"
                    >
                      {use}
                    </span>
                  ))}
                  <a
                    href={property.suggestHref || '#'}
                    className="inline-flex items-center gap-1.5 rounded-full border border-grounds-moss/40 bg-grounds-moss/10 px-3 py-1 text-xs font-semibold text-grounds-moss transition hover:bg-grounds-moss/20"
                  >
                    <MessageSquarePlus className="h-3.5 w-3.5" aria-hidden="true" />
                    Submit an idea
                  </a>
                </div>

                {property.ngoRelations.length > 0 ? (
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[#10231b]/65">
                    <span className="font-semibold uppercase tracking-[0.16em] text-[#10231b]/50">
                      In relation with
                    </span>
                    {property.ngoRelations.map((ngo) => (
                      <a
                        key={ngo.name}
                        href={ngo.href || '#'}
                        className="rounded-full border border-[#10231b]/15 px-2.5 py-1 font-medium text-[#10231b]/80 transition hover:border-grounds-moss/50 hover:text-grounds-moss"
                      >
                        {ngo.name}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* Ways to earn */}
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#10231b]/60">
                  <Coins className="h-4 w-4 text-grounds-clay" aria-hidden="true" />
                  Ways to earn
                </div>
                <div className="mt-3 space-y-2.5">
                  {property.earnTracks.map((track) => (
                    <div
                      key={track.area}
                      className="rounded-2xl border border-[#10231b]/12 bg-white/55 px-3.5 py-3"
                    >
                      <p className="text-sm font-semibold text-[#10231b]">{track.area}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#10231b]/65">
                        <span className="inline-flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-grounds-moss" aria-hidden="true" />
                          {track.cohort}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarClock className="h-3.5 w-3.5 text-grounds-moss" aria-hidden="true" />
                          {track.frequency}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-grounds-moss" aria-hidden="true" />
                          {track.commitment}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {property.detailHref ? (
              <div className="mt-6">
                <Link
                  href={property.detailHref}
                  className="inline-flex items-center gap-2 rounded-full border border-grounds-moss/30 bg-white/65 px-4 py-2 text-sm font-semibold text-grounds-moss transition hover:border-grounds-moss/55 hover:bg-white/90"
                >
                  Open property page
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {hasMany ? (
        <div className="mt-3 flex items-center justify-center gap-2">
          {properties.map((item, itemIndex) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setIndex(itemIndex)}
              aria-label={`View ${item.name}`}
              aria-current={itemIndex === index}
              className={cn(
                'h-2 w-2 rounded-full transition-colors',
                itemIndex === index ? 'bg-grounds-sand' : 'bg-white/25 hover:bg-white/40',
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function PropertyVisual({ property }: { property: PropertyViewport }) {
  const [failed, setFailed] = useState(false)
  const hasModel = Boolean(property.modelUrl)
  useModelViewer(hasModel)

  return (
    <>
      {/* Gradient fallback — also the canvas the 3D model sits on. */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#3d6c57_0%,#16322b_45%,#0b1712_100%)]" />

      {hasModel ? (
        // Interactive, auto-rotating 3D model. Spin/zoom with pointer or touch.
        <model-viewer
          src={property.modelUrl}
          alt={`3D model of ${property.name}`}
          camera-controls=""
          auto-rotate=""
          rotation-per-second="18deg"
          interaction-prompt="none"
          shadow-intensity="1"
          exposure="1"
          environment-image="neutral"
          className="absolute inset-0 h-full w-full"
          style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
        />
      ) : property.imageUrl && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={property.imageUrl}
          alt={property.name}
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full scale-[1.06] object-cover transition-transform duration-700 ease-out group-hover/card:scale-110"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <Plus className="h-10 w-10 text-white/25" aria-hidden="true" />
        </div>
      )}
    </>
  )
}
