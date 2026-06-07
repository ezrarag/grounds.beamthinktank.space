'use client'

import type { FormEvent } from 'react'
import { useState } from 'react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export function SuggestSiteForm() {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [suggestedByName, setSuggestedByName] = useState('')
  const [suggestedByAffiliation, setSuggestedByAffiliation] = useState('')
  const [suggestedUse, setSuggestedUse] = useState('')
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  function clearForm() {
    setName('')
    setAddress('')
    setSuggestedByName('')
    setSuggestedByAffiliation('')
    setSuggestedUse('')
    setNotes('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)

    if (!db) {
      setMessage('Firebase is not configured.')
      return
    }

    const trimmedName = name.trim()
    const trimmedAddress = address.trim()
    const trimmedSuggestedBy = suggestedByName.trim()

    if (!trimmedName || !trimmedAddress || !trimmedSuggestedBy) {
      setMessage('Site name, address, and your name are required.')
      return
    }

    setIsSaving(true)

    try {
      await addDoc(collection(db, 'siteSuggestions'), {
        name: trimmedName,
        address: trimmedAddress,
        suggestedUse: suggestedUse.trim(),
        notes: notes.trim(),
        suggestedBy: {
          name: trimmedSuggestedBy,
          affiliation: suggestedByAffiliation.trim(),
        },
        status: 'new',
        createdAt: new Date().toISOString(),
        updatedAt: serverTimestamp(),
      })
      setMessage(`Suggestion received — ${trimmedName}`)
      clearForm()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to submit site suggestion.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="surface-panel p-6 shadow-grounds">
      <p className="eyebrow">Suggest a Site</p>
      <h2 className="mt-3 text-2xl font-semibold text-white">Add a candidate for review.</h2>
      <p className="mt-3 text-sm leading-7 text-white/66">
        Suggestions enter a review queue before they appear in the public portfolio.
      </p>

      <div className="mt-5 grid gap-3">
        <label className="block text-sm text-white/70">
          Site name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            className="mt-1 w-full rounded-2xl border border-white/10 bg-[#12211c] px-4 py-3 text-white outline-none focus:border-grounds-sand/50"
          />
        </label>

        <label className="block text-sm text-white/70">
          Address or area
          <input
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            required
            className="mt-1 w-full rounded-2xl border border-white/10 bg-[#12211c] px-4 py-3 text-white outline-none focus:border-grounds-sand/50"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm text-white/70">
            Your name
            <input
              value={suggestedByName}
              onChange={(event) => setSuggestedByName(event.target.value)}
              required
              className="mt-1 w-full rounded-2xl border border-white/10 bg-[#12211c] px-4 py-3 text-white outline-none focus:border-grounds-sand/50"
            />
          </label>

          <label className="block text-sm text-white/70">
            Affiliation
            <input
              value={suggestedByAffiliation}
              onChange={(event) => setSuggestedByAffiliation(event.target.value)}
              placeholder="Architecture, neighborhood partner, cohort"
              className="mt-1 w-full rounded-2xl border border-white/10 bg-[#12211c] px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-grounds-sand/50"
            />
          </label>
        </div>

        <label className="block text-sm text-white/70">
          Suggested use
          <input
            value={suggestedUse}
            onChange={(event) => setSuggestedUse(event.target.value)}
            placeholder="training site, civic anchor, cooperative space"
            className="mt-1 w-full rounded-2xl border border-white/10 bg-[#12211c] px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-grounds-sand/50"
          />
        </label>

        <label className="block text-sm text-white/70">
          Notes
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            className="mt-1 w-full rounded-2xl border border-white/10 bg-[#12211c] px-4 py-3 text-white outline-none focus:border-grounds-sand/50"
          />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-full bg-grounds-sand px-5 py-3 text-sm font-semibold text-[#0b1712] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? 'Submitting...' : 'Submit suggestion'}
        </button>
        <button type="button" onClick={clearForm} className="rounded-full border border-white/12 px-5 py-3 text-sm font-medium text-white/80 hover:bg-white/[0.04]">
          Clear
        </button>
      </div>

      {message ? <p className="mt-3 text-sm text-white/66">{message}</p> : null}
    </form>
  )
}
