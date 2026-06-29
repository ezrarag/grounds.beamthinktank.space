'use client'

import { useEffect, useState } from 'react'
import { Trash2, UploadCloud } from 'lucide-react'
import { doc, updateDoc } from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { PropertyMedia } from '@/components/PropertyMedia'
import { db, storage } from '@/lib/firebase'
import { cityLabel } from '@/lib/cities'
import type { MediaItem } from '@/lib/media'
import type { BeamAsset } from '@/lib/useAcquisitionSites'

export function PropertyMediaManager({ site }: { site: BeamAsset | null }) {
  const [heroImageUrl, setHeroImageUrl] = useState('')
  const [media, setMedia] = useState<MediaItem[]>([])
  const [newUrl, setNewUrl] = useState('')
  const [newCaption, setNewCaption] = useState('')
  const [uploadTarget, setUploadTarget] = useState<'hero' | 'gallery' | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    setHeroImageUrl(site?.heroImageUrl ?? '')
    setMedia(site?.media ?? [])
    setNewUrl('')
    setNewCaption('')
    setMessage(null)
  }, [site])

  if (!site) {
    return (
      <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
        <p className="text-sm font-medium text-white">Property media</p>
        <p className="mt-4 text-sm leading-7 text-white/56">Select a site to manage its photos and gallery.</p>
      </section>
    )
  }

  async function uploadFile(file: File, target: 'hero' | 'gallery') {
    if (!storage) {
      setMessage('Firebase Storage is not configured.')
      return
    }
    if (!site) return

    setMessage(null)
    setUploadTarget(target)

    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const storageRef = ref(storage, `property-media/${site.id}/${Date.now()}-${safeName}`)
      const result = await uploadBytes(storageRef, file)
      const url = await getDownloadURL(result.ref)
      const kind = file.type.startsWith('video/') ? 'video' : 'image'

      if (target === 'hero') {
        setHeroImageUrl(url)
      } else {
        setMedia((current) => [...current, { type: kind, url }])
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Upload failed.')
    } finally {
      setUploadTarget(null)
    }
  }

  function addByUrl() {
    const url = newUrl.trim()
    if (!url) return
    const kind: MediaItem['type'] = /\.(mp4|webm|mov)(\?|$)/i.test(url) ? 'video' : 'image'
    setMedia((current) => [...current, { type: kind, url, ...(newCaption.trim() ? { caption: newCaption.trim() } : {}) }])
    setNewUrl('')
    setNewCaption('')
  }

  function removeItem(index: number) {
    setMedia((current) => current.filter((_, itemIndex) => itemIndex !== index))
  }

  async function save() {
    if (!db || !site) {
      setMessage('Firebase is not configured.')
      return
    }

    setIsSaving(true)
    setMessage(null)

    try {
      await updateDoc(doc(db, 'beamAssets', site.id), {
        heroImageUrl: heroImageUrl.trim(),
        media,
        updatedAt: new Date().toISOString(),
      })
      setMessage('Media saved — the front end updates live.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save media.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
      <p className="text-sm font-medium text-white">Property media</p>
      <p className="mt-1 text-sm leading-6 text-white/56">
        {site.publicTitle || site.name} · {cityLabel(site.regionId)}
      </p>

      {/* Live preview — exactly what the public card renders */}
      <div className="mt-4">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">Front-end preview</p>
        <PropertyMedia
          source={{ heroImageUrl, media }}
          alt={site.name}
          className="mt-2 h-40 w-full rounded-2xl"
        />
      </div>

      {/* Hero image */}
      <div className="mt-4">
        <label className="block text-sm text-white/70">
          Hero image URL
          <input
            value={heroImageUrl}
            onChange={(event) => setHeroImageUrl(event.target.value)}
            placeholder="https://… or upload"
            className="mt-1 w-full rounded-2xl border border-white/10 bg-[#12211c] px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-grounds-sand/50"
          />
        </label>
        <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/14 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/[0.04]">
          <UploadCloud className="h-4 w-4 text-grounds-sand" />
          {uploadTarget === 'hero' ? 'Uploading…' : 'Upload hero'}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={uploadTarget !== null}
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void uploadFile(file, 'hero')
              event.target.value = ''
            }}
          />
        </label>
      </div>

      {/* Gallery */}
      <div className="mt-5">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">Gallery</p>

        {media.length > 0 ? (
          <ul className="mt-2 space-y-2">
            {media.map((item, index) => (
              <li key={`${item.url}-${index}`} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#12211c] p-2">
                {item.type === 'image' ? (
                  <PropertyMedia source={{ heroImageUrl: item.url }} alt="" className="h-12 w-16 shrink-0 rounded-lg" />
                ) : (
                  <span className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg bg-black/40 font-mono text-[9px] uppercase text-white/50">
                    video
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate text-xs text-white/60">{item.caption || item.url}</span>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  aria-label="Remove media item"
                  className="rounded-full border border-white/14 p-1.5 text-white/60 hover:border-red-300/40 hover:text-red-200"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-white/50">No gallery items yet.</p>
        )}

        <div className="mt-3 grid gap-2">
          <input
            value={newUrl}
            onChange={(event) => setNewUrl(event.target.value)}
            placeholder="Add media URL (image or video)"
            className="w-full rounded-2xl border border-white/10 bg-[#12211c] px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-grounds-sand/50"
          />
          <input
            value={newCaption}
            onChange={(event) => setNewCaption(event.target.value)}
            placeholder="Caption (optional)"
            className="w-full rounded-2xl border border-white/10 bg-[#12211c] px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-grounds-sand/50"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={addByUrl}
              className="rounded-full border border-grounds-sand/45 px-4 py-2 text-sm font-medium text-grounds-sand"
            >
              Add to gallery
            </button>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/14 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/[0.04]">
              <UploadCloud className="h-4 w-4 text-grounds-sand" />
              {uploadTarget === 'gallery' ? 'Uploading…' : 'Upload to gallery'}
              <input
                type="file"
                accept="image/*,video/mp4,video/webm"
                className="sr-only"
                disabled={uploadTarget !== null}
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) void uploadFile(file, 'gallery')
                  event.target.value = ''
                }}
              />
            </label>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={save}
        disabled={isSaving || uploadTarget !== null}
        className="mt-5 rounded-full bg-grounds-sand px-5 py-3 text-sm font-semibold text-[#0b1712] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSaving ? 'Saving…' : 'Save media'}
      </button>
      {message ? <p className="mt-3 text-sm text-white/66">{message}</p> : null}
    </section>
  )
}
