'use client'

import { useEffect, useState } from 'react'
import { doc, onSnapshot, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  landingSlides,
  defaultOperatingLoopChapters,
  type LandingSlide,
  type OperatingLoopChapter,
} from '@/lib/landingSlides'

export interface LandingConfigState {
  slides: LandingSlide[]
  operatingLoopChapters: OperatingLoopChapter[]
  isLoading: boolean
  hasOverrides: boolean
}

export function useLandingConfig(): LandingConfigState {
  const [slides, setSlides] = useState<LandingSlide[]>(landingSlides)
  const [chapters, setChapters] = useState<OperatingLoopChapter[]>(defaultOperatingLoopChapters)
  const [isLoading, setIsLoading] = useState(true)
  const [hasOverrides, setHasOverrides] = useState(false)

  useEffect(() => {
    if (!db) {
      setIsLoading(false)
      return
    }

    const configDocRef = doc(db, 'landingConfig', 'showcase')

    // Listen for live changes so admin updates reflect instantly on the landing page
    const unsubscribe = onSnapshot(
      configDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data()

          if (data.slides && Array.isArray(data.slides)) {
            // Merge Firestore overrides with base slides
            const merged = landingSlides.map((baseSlide) => {
              const remote = data.slides.find((s: Partial<LandingSlide>) => s.id === baseSlide.id)
              if (!remote) return baseSlide
              return {
                ...baseSlide,
                fallbackImageUrl: remote.fallbackImageUrl || baseSlide.fallbackImageUrl,
                backgroundImages: remote.backgroundImages || baseSlide.backgroundImages,
                videoPlaceholderUrl: remote.videoPlaceholderUrl ?? baseSlide.videoPlaceholderUrl,
                shortTitle: remote.shortTitle || baseSlide.shortTitle,
                shortSummary: remote.shortSummary || baseSlide.shortSummary,
              }
            })
            setSlides(merged)
            setHasOverrides(true)
          }

          if (data.operatingLoopChapters && Array.isArray(data.operatingLoopChapters)) {
            const mergedChapters = defaultOperatingLoopChapters.map((baseCh) => {
              const remote = data.operatingLoopChapters.find((c: Partial<OperatingLoopChapter>) => c.id === baseCh.id)
              if (!remote) return baseCh
              return {
                ...baseCh,
                ...remote,
                videoUrl: remote.videoUrl || baseCh.videoUrl,
              }
            })
            setChapters(mergedChapters)
            setHasOverrides(true)
          }
        }
        setIsLoading(false)
      },
      () => {
        // Fallback to static defaults if offline or rules block
        setIsLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  return {
    slides,
    operatingLoopChapters: chapters,
    isLoading,
    hasOverrides,
  }
}
