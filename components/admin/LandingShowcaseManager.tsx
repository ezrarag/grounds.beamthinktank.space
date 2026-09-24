'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  UploadCloud,
  Layers,
  Video,
  Plus,
  Trash2,
  ExternalLink,
  Sparkles,
  Play,
  Save,
  Loader2,
  ArrowLeft,
  Home,
  LogOut,
} from 'lucide-react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage, signOutUser } from '@/lib/firebase'
import {
  landingSlides,
  defaultOperatingLoopChapters,
  type LandingSlide,
  type OperatingLoopChapter,
} from '@/lib/landingSlides'

export function LandingShowcaseManager() {
  const [activeTab, setActiveTab] = useState<'slides' | 'loop'>('slides')
  const [slides, setSlides] = useState<LandingSlide[]>(landingSlides)
  const [chapters, setChapters] = useState<OperatingLoopChapter[]>(defaultOperatingLoopChapters)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)

  async function handleSignOut() {
    setIsSigningOut(true)
    try {
      await signOutUser()
      router.push('/login')
    } catch {
      setIsSigningOut(false)
    }
  }

  // New image URL input buffer per slide
  const [newImageUrls, setNewImageUrls] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!db) {
      setIsLoading(false)
      return
    }

    const docRef = doc(db, 'landingConfig', 'showcase')
    getDoc(docRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data()
          if (data.slides && Array.isArray(data.slides)) {
            const merged = landingSlides.map((base) => {
              const remote = data.slides.find((s: Partial<LandingSlide>) => s.id === base.id)
              if (!remote) return base
              return {
                ...base,
                fallbackImageUrl: remote.fallbackImageUrl || base.fallbackImageUrl,
                backgroundImages: remote.backgroundImages || base.backgroundImages,
                shortTitle: remote.shortTitle || base.shortTitle,
                shortSummary: remote.shortSummary || base.shortSummary,
              }
            })
            setSlides(merged)
          }
          if (data.operatingLoopChapters && Array.isArray(data.operatingLoopChapters)) {
            setChapters(data.operatingLoopChapters)
          }
        }
      })
      .catch((err) => setError('Could not load remote config; using default slides.'))
      .finally(() => setIsLoading(false))
  }, [])

  // Slide Image Operations
  function handleAddImageUrl(slideId: string) {
    const url = newImageUrls[slideId]?.trim()
    if (!url) return

    setSlides((prev) =>
      prev.map((s) => {
        if (s.id !== slideId) return s
        const currentList = s.backgroundImages || [s.fallbackImageUrl]
        const updatedList = Array.from(new Set([...currentList, url]))
        return {
          ...s,
          backgroundImages: updatedList,
          fallbackImageUrl: updatedList[0] || url,
        }
      })
    )

    setNewImageUrls((prev) => ({ ...prev, [slideId]: '' }))
  }

  function handleSetPrimaryImage(slideId: string, url: string) {
    setSlides((prev) =>
      prev.map((s) => {
        if (s.id !== slideId) return s
        const list = s.backgroundImages || []
        const reordered = [url, ...list.filter((img) => img !== url)]
        return {
          ...s,
          fallbackImageUrl: url,
          backgroundImages: reordered,
        }
      })
    )
  }

  function handleRemoveImage(slideId: string, url: string) {
    setSlides((prev) =>
      prev.map((s) => {
        if (s.id !== slideId) return s
        const filtered = (s.backgroundImages || []).filter((img) => img !== url)
        return {
          ...s,
          fallbackImageUrl: filtered[0] || s.fallbackImageUrl,
          backgroundImages: filtered,
        }
      })
    )
  }

  async function handleUploadSlideImage(slideId: string, file: File) {
    if (!storage) {
      setError('Firebase Storage is not configured.')
      return
    }

    setUploadingTarget(`slide-${slideId}`)
    setError(null)

    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const storageRef = ref(storage, `landing-media/slides/${slideId}-${Date.now()}-${safeName}`)
      const res = await uploadBytes(storageRef, file)
      const url = await getDownloadURL(res.ref)

      setSlides((prev) =>
        prev.map((s) => {
          if (s.id !== slideId) return s
          const currentList = s.backgroundImages || [s.fallbackImageUrl]
          return {
            ...s,
            fallbackImageUrl: url,
            backgroundImages: [url, ...currentList.filter((img) => img !== url)],
          }
        })
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed.')
    } finally {
      setUploadingTarget(null)
    }
  }

  // Operating Loop Operations
  function updateChapter(chapterId: string, patch: Partial<OperatingLoopChapter>) {
    setChapters((prev) =>
      prev.map((ch) => (ch.id === chapterId ? { ...ch, ...patch } : ch))
    )
  }

  async function handleUploadChapterVideo(chapterId: string, file: File) {
    if (!storage) {
      setError('Firebase Storage is not configured.')
      return
    }

    setUploadingTarget(`loop-${chapterId}`)
    setError(null)

    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const storageRef = ref(storage, `landing-media/90sec/${chapterId}-${Date.now()}-${safeName}`)
      const res = await uploadBytes(storageRef, file)
      const url = await getDownloadURL(res.ref)

      updateChapter(chapterId, { videoUrl: url })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Video upload failed.')
    } finally {
      setUploadingTarget(null)
    }
  }

  // Save changes to Firestore
  async function handleSaveAll() {
    if (!db) {
      setError('Firestore is not configured.')
      return
    }

    setIsSaving(true)
    setError(null)
    setSavedMessage(null)

    try {
      const docRef = doc(db, 'landingConfig', 'showcase')
      await setDoc(
        docRef,
        {
          slides,
          operatingLoopChapters: chapters,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )

      setSavedMessage('Landing showcase & 90-second operating loop successfully saved! Changes are live on the homepage.')
      setTimeout(() => setSavedMessage(null), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center text-sm text-white/60">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-emerald-400" />
        <p className="mt-3">Loading landing configuration...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Exit Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <Link
          href="/portal/admin"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 font-mono text-xs text-white/80 hover:bg-white/10 hover:text-white transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Admin Console
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 font-mono text-xs text-white/80 hover:bg-white/10 hover:text-white transition"
          >
            <Home className="h-3.5 w-3.5" />
            Public Home
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3.5 py-1.5 font-mono text-xs text-rose-300 hover:bg-rose-500/20 transition disabled:opacity-50"
          >
            {isSigningOut ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
            Sign Out
          </button>
        </div>
      </div>

      {/* Top Banner & Save Action */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#0e1f1a] p-5">
        <div>
          <h2 className="text-xl font-bold text-white">Landing Showcase & 90s Loop Manager</h2>
          <p className="mt-1 text-xs text-white/65">
            Modify background artwork, upload custom videos for each chapter of the 90-second loop, and customize messaging.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveAll}
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-6 py-2.5 text-xs font-semibold text-[#07100c] shadow-lg hover:bg-emerald-300 disabled:opacity-50 transition"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Publish Changes Live
        </button>
      </div>

      {savedMessage ? (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-medium text-emerald-300">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{savedMessage}</span>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
          {error}
        </div>
      ) : null}

      {/* Tabs */}
      <div className="flex border-b border-white/10 gap-4">
        <button
          type="button"
          onClick={() => setActiveTab('slides')}
          className={`flex items-center gap-2 pb-3 text-xs font-mono uppercase tracking-wider transition ${
            activeTab === 'slides'
              ? 'border-b-2 border-emerald-400 text-emerald-400 font-semibold'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Layers className="h-4 w-4" />
          Slide Backgrounds & Content
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('loop')}
          className={`flex items-center gap-2 pb-3 text-xs font-mono uppercase tracking-wider transition ${
            activeTab === 'loop'
              ? 'border-b-2 border-emerald-400 text-emerald-400 font-semibold'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Video className="h-4 w-4" />
          90-Second Operating Loop Video
        </button>
      </div>

      {/* Tab 1: Slide Backgrounds */}
      {activeTab === 'slides' ? (
        <div className="space-y-6">
          {slides.map((slide) => {
            const imageList = slide.backgroundImages && slide.backgroundImages.length > 0
              ? slide.backgroundImages
              : [slide.fallbackImageUrl].filter(Boolean)

            return (
              <div
                key={slide.id}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-beam-gold">
                      Slide {slide.stepNumber} {'//'} {slide.eyebrow}
                    </span>
                    <h3 className="text-lg font-semibold text-white">{slide.shortTitle}</h3>
                  </div>
                  <span className="font-mono text-xs text-white/50">
                    {imageList.length} {imageList.length === 1 ? 'image' : 'images'} registered
                  </span>
                </div>

                {/* Image Gallery & Selectors */}
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-white/70 mb-2">
                    Background Images (Click an image to set as Primary)
                  </label>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {imageList.map((imgUrl, i) => {
                      const isPrimary = slide.fallbackImageUrl === imgUrl
                      return (
                        <div
                          key={imgUrl}
                          className={`group relative aspect-video overflow-hidden rounded-xl border transition ${
                            isPrimary
                              ? 'border-emerald-400 ring-2 ring-emerald-400/30'
                              : 'border-white/15 opacity-70 hover:opacity-100'
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imgUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2">
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryImage(slide.id, imgUrl)}
                              className="rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-mono text-emerald-300 hover:bg-black/90"
                            >
                              {isPrimary ? 'Primary' : 'Make Primary'}
                            </button>
                            {imageList.length > 1 ? (
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(slide.id, imgUrl)}
                                className="rounded p-1 text-rose-400 hover:bg-black/80"
                                aria-label="Remove image"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            ) : null}
                          </div>
                          {isPrimary ? (
                            <span className="absolute left-1.5 top-1.5 rounded-full bg-emerald-400 px-2 py-0.5 text-[9px] font-bold text-black uppercase">
                              Active
                            </span>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Add by URL or Upload from device */}
                <div className="grid gap-3 pt-2 sm:grid-cols-2">
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="Paste new image URL (e.g. Firebase Storage)..."
                      value={newImageUrls[slide.id] || ''}
                      onChange={(e) =>
                        setNewImageUrls((prev) => ({ ...prev, [slide.id]: e.target.value }))
                      }
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-emerald-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddImageUrl(slide.id)}
                      className="shrink-0 inline-flex items-center gap-1 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-mono text-white hover:bg-white/20"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add
                    </button>
                  </div>

                  <div>
                    <label className="flex items-center justify-center gap-2 cursor-pointer rounded-xl border border-dashed border-white/25 bg-white/[0.02] px-4 py-2 text-xs font-mono text-white/70 hover:border-emerald-400 hover:text-white transition">
                      {uploadingTarget === `slide-${slide.id}` ? (
                        <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                      ) : (
                        <UploadCloud className="h-4 w-4 text-emerald-400" />
                      )}
                      <span>Upload from Device (.jpg, .png, .webp)</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleUploadSlideImage(slide.id, file)
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : null}

      {/* Tab 2: 90-Second Operating Loop Chapters */}
      {activeTab === 'loop' ? (
        <div className="space-y-6">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4 text-xs leading-relaxed text-emerald-200">
            <span className="font-semibold">How it works:</span> The 90-Second Operating Loop plays during executive briefings. You can assign dedicated video files (.mp4) to each chapter or update the narration text.
          </div>

          {chapters.map((ch, idx) => (
            <div
              key={ch.id || ch.time}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] text-emerald-400">
                    Chapter {idx + 1}
                  </span>
                  <span className="font-mono text-xs text-white/50">{ch.time}</span>
                  <h3 className="text-base font-semibold text-white">{ch.title}</h3>
                </div>
                {ch.videoUrl ? (
                  <span className="font-mono text-[11px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Video Configured
                  </span>
                ) : (
                  <span className="font-mono text-[11px] text-white/40">Default Ambient Loop</span>
                )}
              </div>

              {/* Title & Time */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-white/60 mb-1">
                    Timestamp
                  </label>
                  <input
                    type="text"
                    value={ch.time}
                    onChange={(e) => updateChapter(ch.id, { time: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-white/60 mb-1">
                    Chapter Title
                  </label>
                  <input
                    type="text"
                    value={ch.title}
                    onChange={(e) => updateChapter(ch.id, { title: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Narration Text */}
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-white/60 mb-1">
                  Narration / Captions Text
                </label>
                <textarea
                  rows={2}
                  value={ch.text}
                  onChange={(e) => updateChapter(ch.id, { text: e.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none"
                />
              </div>

              {/* Video URL or Upload */}
              <div className="grid gap-3 pt-2 sm:grid-cols-2">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-white/60 mb-1">
                    Video URL (.mp4)
                  </label>
                  <input
                    type="url"
                    placeholder="https://firebasestorage.../video.mp4"
                    value={ch.videoUrl || ''}
                    onChange={(e) => updateChapter(ch.id, { videoUrl: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-white/60 mb-1">
                    Or Upload Video
                  </label>
                  <label className="flex items-center justify-center gap-2 cursor-pointer rounded-xl border border-dashed border-white/25 bg-white/[0.02] px-4 py-2 text-xs font-mono text-white/70 hover:border-emerald-400 hover:text-white transition">
                    {uploadingTarget === `loop-${ch.id}` ? (
                      <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                    ) : (
                      <Video className="h-4 w-4 text-emerald-400" />
                    )}
                    <span>Upload Video File (.mp4)</span>
                    <input
                      type="file"
                      accept="video/mp4,video/*"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleUploadChapterVideo(ch.id, file)
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
