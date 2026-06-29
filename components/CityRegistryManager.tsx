'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { makeCityId, type CivicSourceType, type StoredCity } from '@/lib/cities'
import { useCities } from '@/lib/useCities'

const SOURCE_TYPES: CivicSourceType[] = ['socrata', 'ckan', 'none']

export function CityRegistryManager() {
  const { cities, storedIds } = useCities()
  const [isOpen, setIsOpen] = useState(false)
  const [label, setLabel] = useState('')
  const [state, setState] = useState('')
  const [type, setType] = useState<CivicSourceType>('socrata')
  const [baseUrl, setBaseUrl] = useState('')
  const [resourceId, setResourceId] = useState('')
  const [fieldMapText, setFieldMapText] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const previewId = label.trim() && state.trim() ? makeCityId(label, state) : ''

  function reset() {
    setLabel('')
    setState('')
    setType('socrata')
    setBaseUrl('')
    setResourceId('')
    setFieldMapText('')
  }

  async function save() {
    setMessage(null)

    if (!db) {
      setMessage('Firebase is not configured.')
      return
    }
    if (!label.trim() || !state.trim()) {
      setMessage('City name and state are required.')
      return
    }

    let fieldMap: StoredCity['fieldMap']
    if (fieldMapText.trim()) {
      try {
        fieldMap = JSON.parse(fieldMapText)
      } catch {
        setMessage('Field map must be valid JSON, e.g. {"address":"situs_address"}.')
        return
      }
    }

    const id = makeCityId(label, state)
    const payload: StoredCity = {
      label: label.trim(),
      state: state.trim().toUpperCase(),
      type,
      ...(baseUrl.trim() ? { baseUrl: baseUrl.trim() } : {}),
      ...(resourceId.trim() ? { resourceId: resourceId.trim() } : {}),
      ...(fieldMap ? { fieldMap } : {}),
    }

    setIsSaving(true)
    try {
      await setDoc(doc(db, 'cities', id), { ...payload, updatedAt: serverTimestamp() }, { merge: true })
      setMessage(`Saved ${payload.label}, ${payload.state} (${id}).`)
      reset()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save city.')
    } finally {
      setIsSaving(false)
    }
  }

  async function remove(id: string) {
    if (!db) return
    setMessage(null)
    try {
      await deleteDoc(doc(db, 'cities', id))
      setMessage(`Removed ${id}.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to remove city.')
    }
  }

  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between text-left text-sm font-medium text-white"
      >
        City registry
        <span className="text-grounds-sand">{isOpen ? 'Hide' : 'Show'}</span>
      </button>

      {isOpen ? (
        <div className="mt-4 space-y-4">
          <p className="text-xs leading-6 text-white/50">
            Add a city to enable site entry, filtering, and civic scans for it — no code change needed. Find the
            city&apos;s open-data dataset id (Socrata <span className="text-white/70">xxxx-xxxx</span> or CKAN resource
            UUID) and paste it here. See docs/ADDING_CITIES.md.
          </p>

          {/* Existing cities */}
          <div className="space-y-1.5">
            {cities.map((city) => {
              const editable = storedIds.has(city.id)
              return (
                <div
                  key={city.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#12211c] px-3 py-2 text-sm"
                >
                  <span className="min-w-0">
                    <span className="text-white">
                      {city.label}, {city.state}
                    </span>{' '}
                    <span className="font-mono text-[10px] uppercase tracking-wider text-white/40">
                      {city.dataSource.type}
                      {editable ? '' : ' · built-in'}
                    </span>
                  </span>
                  {editable ? (
                    <button
                      type="button"
                      onClick={() => remove(city.id)}
                      aria-label={`Remove ${city.label}`}
                      className="rounded-full border border-white/14 p-1.5 text-white/60 hover:border-red-300/40 hover:text-red-200"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
              )
            })}
          </div>

          {/* Add / update form */}
          <div className="grid gap-3 rounded-[1.25rem] border border-white/10 bg-[#12211c] p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm text-white/70">
                City name
                <input
                  value={label}
                  onChange={(event) => setLabel(event.target.value)}
                  placeholder="Austin"
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-[#0b1712] px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-grounds-sand/50"
                />
              </label>
              <label className="block text-sm text-white/70">
                State
                <input
                  value={state}
                  onChange={(event) => setState(event.target.value)}
                  placeholder="TX"
                  maxLength={2}
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-[#0b1712] px-4 py-3 text-white uppercase outline-none placeholder:text-white/30 focus:border-grounds-sand/50"
                />
              </label>
            </div>

            <label className="block text-sm text-white/70">
              Source type
              <select
                value={type}
                onChange={(event) => setType(event.target.value as CivicSourceType)}
                className="mt-1 w-full rounded-2xl border border-white/10 bg-[#0b1712] px-4 py-3 text-white outline-none focus:border-grounds-sand/50"
              >
                {SOURCE_TYPES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            {type !== 'none' ? (
              <>
                <label className="block text-sm text-white/70">
                  Portal base URL
                  <input
                    value={baseUrl}
                    onChange={(event) => setBaseUrl(event.target.value)}
                    placeholder="https://data.austintexas.gov"
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-[#0b1712] px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-grounds-sand/50"
                  />
                </label>
                <label className="block text-sm text-white/70">
                  Dataset / resource id
                  <input
                    value={resourceId}
                    onChange={(event) => setResourceId(event.target.value)}
                    placeholder={type === 'socrata' ? 'xxxx-xxxx' : 'resource UUID'}
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-[#0b1712] px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-grounds-sand/50"
                  />
                </label>
                <label className="block text-sm text-white/70">
                  Field map (optional JSON)
                  <textarea
                    value={fieldMapText}
                    onChange={(event) => setFieldMapText(event.target.value)}
                    rows={2}
                    placeholder='{"address":"situs_address","ownerName":"owner"}'
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-[#0b1712] px-4 py-3 font-mono text-xs text-white outline-none placeholder:text-white/30 focus:border-grounds-sand/50"
                  />
                </label>
              </>
            ) : null}

            {previewId ? (
              <p className="font-mono text-[10px] uppercase tracking-wider text-white/40">id: {previewId}</p>
            ) : null}

            <button
              type="button"
              onClick={save}
              disabled={isSaving}
              className="justify-self-start rounded-full bg-grounds-sand px-5 py-2.5 text-sm font-semibold text-[#0b1712] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? 'Saving…' : 'Save city'}
            </button>
          </div>

          {message ? <p className="text-sm text-white/66">{message}</p> : null}
        </div>
      ) : null}
    </section>
  )
}
