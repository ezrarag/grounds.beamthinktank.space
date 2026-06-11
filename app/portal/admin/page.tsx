'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, UploadCloud } from 'lucide-react'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { PortalShell } from '@/components/PortalShell'
import { db, storage } from '@/lib/firebase'
import { groundsConfig, type PathwayMediaType, type PathwayRole } from '@/lib/ngoConfig'
import { pathwayConfigDocPath, type PathwayMediaOverrides } from '@/lib/usePathwayConfig'

const MEDIA_TYPES: PathwayMediaType[] = ['none', 'image', 'video']

type DraftEntry = { mediaType: PathwayMediaType; mediaUrl: string }
type Draft = Record<PathwayRole, DraftEntry>

function emptyDraft(): Draft {
  return groundsConfig.pathways.reduce((draft, pathway) => {
    draft[pathway.role] = {
      mediaType: pathway.mediaType ?? 'none',
      mediaUrl: pathway.mediaUrl ?? '',
    }
    return draft
  }, {} as Draft)
}

function PathwayMediaManager() {
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [uploadingRole, setUploadingRole] = useState<PathwayRole | null>(null)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!db) {
      setIsLoading(false)
      return
    }

    const [collectionId, docId] = pathwayConfigDocPath(groundsConfig)

    getDoc(doc(db, collectionId, docId))
      .then((snapshot) => {
        const overrides = snapshot.data()?.pathwayMedia as PathwayMediaOverrides | undefined
        if (!overrides) return

        setDraft((current) => {
          const next = { ...current }
          for (const pathway of groundsConfig.pathways) {
            const override = overrides[pathway.role]
            if (!override) continue
            next[pathway.role] = {
              mediaType: override.mediaType ?? current[pathway.role].mediaType,
              mediaUrl: override.mediaUrl ?? current[pathway.role].mediaUrl,
            }
          }
          return next
        })
      })
      .catch(() => setError('Unable to load the saved pathway media config.'))
      .finally(() => setIsLoading(false))
  }, [])

  function updateEntry(role: PathwayRole, patch: Partial<DraftEntry>) {
    setSavedAt(null)
    setDraft((current) => ({ ...current, [role]: { ...current[role], ...patch } }))
  }

  async function handleUpload(role: PathwayRole, file: File) {
    if (!storage) {
      setError('Firebase Storage is not configured.')
      return
    }

    setError(null)
    setUploadingRole(role)

    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const storageRef = ref(storage, `pathway-media/${groundsConfig.subdomain}/${role}-${Date.now()}-${safeName}`)
      const result = await uploadBytes(storageRef, file)
      const url = await getDownloadURL(result.ref)
      updateEntry(role, {
        mediaUrl: url,
        mediaType: file.type.startsWith('video/') ? 'video' : 'image',
      })
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Upload failed.')
    } finally {
      setUploadingRole(null)
    }
  }

  async function handleSave() {
    if (!db) {
      setError('Firestore is not configured.')
      return
    }

    setError(null)
    setIsSaving(true)

    try {
      const [collectionId, docId] = pathwayConfigDocPath(groundsConfig)
      await setDoc(
        doc(db, collectionId, docId),
        { pathwayMedia: draft, updatedAt: serverTimestamp() },
        { merge: true },
      )
      setSavedAt(Date.now())
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6 text-sm text-white/64">
        Loading pathway media config...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[1.25rem] border border-white/10 bg-[#12211c] p-4 text-sm leading-6 text-white/62">
        Media renders behind the pathway card on the public landing page. Use <span className="text-white">.mp4 (H.264)</span> for
        video — .mov files often fail to autoplay on mobile browsers. Images and videos are dimmed automatically to keep text readable.
      </div>

      {groundsConfig.pathways.map((pathway) => {
        const entry = draft[pathway.role]

        return (
          <div key={pathway.role} className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-white">{pathway.title}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/40">{pathway.role}</p>
              </div>
              <div className="flex gap-2">
                {MEDIA_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => updateEntry(pathway.role, { mediaType: type })}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      entry.mediaType === type
                        ? 'border-grounds-sand/45 bg-grounds-sand/10 text-grounds-sand'
                        : 'border-white/10 bg-white/[0.03] text-white/64 hover:border-white/20'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {entry.mediaType !== 'none' ? (
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  type="url"
                  value={entry.mediaUrl}
                  onChange={(event) => updateEntry(pathway.role, { mediaUrl: event.target.value })}
                  placeholder="Paste a media URL or upload a file"
                  className="w-full flex-1 rounded-2xl border border-white/10 bg-[#12211c] px-4 py-2.5 text-sm text-white outline-none focus:border-grounds-sand/50"
                />
                <label className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full border border-white/14 px-4 py-2.5 text-sm font-medium text-white/80 hover:bg-white/[0.04]">
                  <UploadCloud className="h-4 w-4 text-grounds-sand" />
                  {uploadingRole === pathway.role ? 'Uploading...' : 'Upload'}
                  <input
                    type="file"
                    accept={entry.mediaType === 'video' ? 'video/mp4,video/webm' : 'image/*'}
                    className="sr-only"
                    disabled={uploadingRole !== null}
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (file) void handleUpload(pathway.role, file)
                      event.target.value = ''
                    }}
                  />
                </label>
              </div>
            ) : null}
          </div>
        )
      })}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || uploadingRole !== null}
          className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-[#0b1712] disabled:cursor-not-allowed disabled:opacity-60"
          style={{ backgroundColor: groundsConfig.primaryColor }}
        >
          {isSaving ? 'Saving...' : 'Save pathway media'}
        </button>
        {savedAt ? (
          <span className="inline-flex items-center gap-2 text-sm text-grounds-sand">
            <CheckCircle2 className="h-4 w-4" />
            Saved — the landing page updates live.
          </span>
        ) : null}
        {error ? <span className="text-sm text-red-100">{error}</span> : null}
      </div>
    </div>
  )
}

export default function PortalAdminPage() {
  return (
    <PortalShell
      config={groundsConfig}
      title="Site admin"
      description="Manage the media shown behind each pathway card on the public landing page."
    >
      <PathwayMediaManager />
    </PortalShell>
  )
}
