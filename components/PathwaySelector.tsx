'use client'

import { useMemo, useRef, useState, type TouchEvent } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Handshake,
  Hammer,
  Home,
  Megaphone,
  RefreshCw,
  Scale,
  type LucideIcon,
} from 'lucide-react'
import type { ChapterContext, Pathway } from '@/lib/ngoConfig'

const ICONS: Record<string, LucideIcon> = {
  home: Home,
  hammer: Hammer,
  megaphone: Megaphone,
  handshake: Handshake,
  scale: Scale,
}

const SWIPE_THRESHOLD = 40

interface PathwaySelectorProps {
  pathways: Pathway[]
  chapters: ChapterContext[]
  divisionName: string
}

export function PathwaySelector({ pathways, chapters, divisionName }: PathwaySelectorProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [chapterId, setChapterId] = useState(chapters[0]?.id ?? '')
  const touchStartX = useRef<number | null>(null)

  const activeChapter = useMemo(
    () => chapters.find((chapter) => chapter.id === chapterId) ?? chapters[0],
    [chapters, chapterId],
  )

  function goTo(index: number) {
    const next = (index + pathways.length) % pathways.length
    setActiveIndex(next)
  }

  function cycleChapter() {
    const currentIndex = chapters.findIndex((chapter) => chapter.id === chapterId)
    const nextChapter = chapters[(currentIndex + 1) % chapters.length]
    if (nextChapter) setChapterId(nextChapter.id)
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    touchStartX.current = event.touches[0]?.clientX ?? null
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (touchStartX.current === null) return
    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current
    const delta = endX - touchStartX.current

    if (delta > SWIPE_THRESHOLD) {
      goTo(activeIndex - 1)
    } else if (delta < -SWIPE_THRESHOLD) {
      goTo(activeIndex + 1)
    }

    touchStartX.current = null
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowLeft') goTo(activeIndex - 1)
    if (event.key === 'ArrowRight') goTo(activeIndex + 1)
  }

  const activePathway = pathways[activeIndex]

  return (
    <section className="surface-panel p-6 shadow-grounds">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Get involved with {divisionName}</p>
          <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Find your way in</h2>
        </div>
        {chapters.length > 1 ? (
          <button
            type="button"
            onClick={cycleChapter}
            className="inline-flex items-center gap-2 rounded-full border border-white/14 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/[0.04]"
            aria-label={`Switch context, currently viewing ${activeChapter?.label}`}
          >
            {activeChapter?.label}
          </button>
        ) : null}
      </div>

      <div className="relative mt-6">
        <div
          className="overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="flex transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {pathways.map((pathway, index) => {
              const Icon = ICONS[pathway.icon] ?? Home
              const description = activeChapter
                ? pathway.description[activeChapter.id] ?? Object.values(pathway.description)[0]
                : Object.values(pathway.description)[0]
              const ctaHref = `${pathway.ctaHref}?role=${encodeURIComponent(pathway.role)}&chapter=${encodeURIComponent(activeChapter?.id ?? '')}`
              const hasMedia = Boolean(pathway.mediaUrl && pathway.mediaType && pathway.mediaType !== 'none')

              return (
                <article
                  key={pathway.role}
                  className="w-full shrink-0 px-1 sm:px-2"
                  tabIndex={index === activeIndex ? 0 : -1}
                  onKeyDown={handleKeyDown}
                  aria-hidden={index !== activeIndex}
                >
                  <div className="relative h-full overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.03]">
                    {hasMedia ? (
                      <div className="absolute inset-0 z-0">
                        {pathway.mediaType === 'video' ? (
                          <video
                            src={pathway.mediaUrl}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={pathway.mediaUrl} alt="" className="h-full w-full object-cover" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/55 to-black/30" />
                      </div>
                    ) : null}

                    <div className="relative z-10 flex h-full flex-col p-6 sm:p-8">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-grounds-sage/20 text-grounds-sand">
                        <Icon className="h-6 w-6" aria-hidden="true" />
                      </div>
                      <h3 className="mt-4 text-xl font-semibold text-white sm:text-2xl">{pathway.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-white/70 sm:text-base">{description}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {pathway.badges.map((badge) => (
                          <span
                            key={badge}
                            className="rounded-full border border-white/12 px-3 py-1 text-xs font-medium text-white/72"
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                      <div className="mt-4 flex items-center gap-2 text-xs text-white/56">
                        <RefreshCw className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>{pathway.loopLine}</span>
                      </div>
                      <a
                        href={ctaHref}
                        className="mt-6 inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-[#0b1712]"
                        style={{ backgroundColor: '#88aa8f' }}
                      >
                        {pathway.ctaLabel}
                      </a>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={() => goTo(activeIndex - 1)}
          aria-label="Previous pathway"
          className="absolute left-0 top-1/2 hidden -translate-x-4 -translate-y-1/2 rounded-full border border-white/14 bg-[#0b1712]/80 p-2 text-white/80 hover:bg-white/[0.08] sm:flex"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => goTo(activeIndex + 1)}
          aria-label="Next pathway"
          className="absolute right-0 top-1/2 hidden -translate-y-1/2 translate-x-4 rounded-full border border-white/14 bg-[#0b1712]/80 p-2 text-white/80 hover:bg-white/[0.08] sm:flex"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-6 flex items-center justify-center gap-2">
        {pathways.map((pathway, index) => (
          <button
            key={pathway.role}
            type="button"
            onClick={() => goTo(index)}
            aria-label={`Go to ${pathway.title}`}
            aria-current={index === activeIndex}
            className={`h-2.5 w-2.5 rounded-full transition-colors ${
              index === activeIndex ? 'bg-grounds-sand' : 'bg-white/20'
            }`}
          />
        ))}
      </div>

      {activePathway ? <span className="sr-only">Showing pathway: {activePathway.title}</span> : null}
    </section>
  )
}
