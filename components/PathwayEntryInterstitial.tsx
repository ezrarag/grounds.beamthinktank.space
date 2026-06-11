'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { type User } from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { ArrowRight, Handshake, Hammer, Home, Megaphone, Scale, type LucideIcon } from 'lucide-react'
import { db } from '@/lib/firebase'
import { groundsConfig, type PathwayRole } from '@/lib/ngoConfig'
import { resolvePortalPath } from '@/lib/resolvePortalPath'

const ICONS: Record<string, LucideIcon> = {
  home: Home,
  hammer: Hammer,
  megaphone: Megaphone,
  handshake: Handshake,
  scale: Scale,
}

/**
 * Fallback for an authenticated member with no `pathwayRole` (legacy users,
 * direct logins). Selecting a door writes `pathwayRole` + `chapter` to
 * `memberships/{uid}` and routes them to the matching workspace.
 * Reuses the public PathwaySelector copy from the NGO config.
 */
export function PathwayEntryInterstitial({ user }: { user: User }) {
  const router = useRouter()
  const chapters = groundsConfig.chapters
  const [chapterId, setChapterId] = useState(chapters[0]?.id ?? '')
  const [savingRole, setSavingRole] = useState<PathwayRole | null>(null)
  const [error, setError] = useState<string | null>(null)

  const activeChapter = chapters.find((chapter) => chapter.id === chapterId) ?? chapters[0]

  async function choose(pathwayRole: PathwayRole) {
    if (!db) {
      setError('Firestore is not configured.')
      return
    }

    setError(null)
    setSavingRole(pathwayRole)

    try {
      await setDoc(
        doc(db, 'memberships', user.uid),
        { uid: user.uid, pathwayRole, chapter: chapterId, updatedAt: serverTimestamp() },
        { merge: true },
      )
      router.replace(resolvePortalPath({ pathwayRole }))
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save your selection.')
      setSavingRole(null)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-10">
      <section className="surface-panel p-8 shadow-grounds">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Choose your entry point</p>
            <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">How are you joining {groundsConfig.name}?</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/68">
              Pick the door that fits you. This sets your workspace — you can be re-sorted later by an admin.
            </p>
          </div>
          {chapters.length > 1 ? (
            <div className="flex gap-2">
              {chapters.map((chapter) => (
                <button
                  key={chapter.id}
                  type="button"
                  onClick={() => setChapterId(chapter.id)}
                  aria-pressed={chapter.id === chapterId}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    chapter.id === chapterId
                      ? 'border-grounds-sand/45 bg-grounds-sand/10 text-grounds-sand'
                      : 'border-white/12 bg-white/[0.03] text-white/72 hover:bg-white/[0.05]'
                  }`}
                >
                  {chapter.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {groundsConfig.pathways.map((pathway) => {
            const Icon = ICONS[pathway.icon] ?? Home
            const description = activeChapter
              ? pathway.description[activeChapter.id] ?? Object.values(pathway.description)[0]
              : Object.values(pathway.description)[0]
            const isSaving = savingRole === pathway.role

            return (
              <button
                key={pathway.role}
                type="button"
                onClick={() => choose(pathway.role)}
                disabled={savingRole !== null}
                className="flex h-full flex-col rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5 text-left transition hover:border-white/25 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-grounds-sage/20 text-grounds-sand">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <p className="mt-4 font-medium text-white">{pathway.title}</p>
                <p className="mt-2 flex-1 text-sm leading-6 text-white/64">{description}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-grounds-sand">
                  {isSaving ? 'Setting up...' : 'Choose this door'}
                  <ArrowRight className="h-4 w-4" />
                </span>
              </button>
            )
          })}
        </div>

        {error ? <p className="mt-4 text-sm text-red-100">{error}</p> : null}
      </section>
    </div>
  )
}
