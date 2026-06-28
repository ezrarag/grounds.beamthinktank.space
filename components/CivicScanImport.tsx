'use client'

import { useState } from 'react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { CITIES, getCity, type CivicRecord } from '@/lib/cities'

const zeroScores = { capacity: 0, impact: 0, stability: 0, revenue: 0, partner: 0 }

export function CivicScanImport() {
  const [isOpen, setIsOpen] = useState(false)
  const [cityId, setCityId] = useState(CITIES[0]?.id ?? '')
  const [query, setQuery] = useState('')
  const [records, setRecords] = useState<CivicRecord[]>([])
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [publishPublic, setPublishPublic] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  function toggle(sourceId: string) {
    setSelected((current) => ({ ...current, [sourceId]: !current[sourceId] }))
  }

  async function scan() {
    setMessage(null)
    setRecords([])
    setSelected({})
    setIsScanning(true)

    try {
      const params = new URLSearchParams({ city: cityId, limit: '25' })
      if (query.trim()) params.set('q', query.trim())
      const response = await fetch(`/api/civic?${params.toString()}`)
      const payload = (await response.json()) as { records?: CivicRecord[]; error?: string }

      if (!response.ok) {
        setMessage(payload.error ?? 'Scan failed.')
        return
      }

      setRecords(payload.records ?? [])
      setMessage(payload.records?.length ? `Found ${payload.records.length} records.` : 'No records found.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to scan civic records.')
    } finally {
      setIsScanning(false)
    }
  }

  async function importSelected() {
    setMessage(null)

    if (!db) {
      setMessage('Firebase is not configured.')
      return
    }

    const chosen = records.filter((record) => selected[record.sourceId])
    if (chosen.length === 0) {
      setMessage('Select at least one record to add.')
      return
    }

    const city = getCity(cityId)
    setIsImporting(true)

    try {
      for (const record of chosen) {
        const now = new Date().toISOString()
        const name = record.name || record.address || 'Untitled parcel'

        await addDoc(collection(db, 'beamAssets'), {
          name,
          address: record.address,
          regionId: cityId,
          city: city?.label ?? cityId,
          ownerName: record.ownerName,
          acquisitionStage: 'SIGNAL',
          condition: 'unknown',
          locationType: 'property',
          stewardshipStatus: 'unmonitored',
          operatorNarrative: '',
          primaryUseCases: [],
          scores: zeroScores,
          stageHistory: [{ stage: 'SIGNAL', timestamp: now, note: `Imported from ${city?.label ?? cityId} civic records` }],
          linkedProjectIds: [],
          linkedActionIds: [],
          ...(record.ownerName ? { ckanOwnerName: record.ownerName } : {}),
          ...(record.zoning ? { ckanZoning: record.zoning } : {}),
          ...(record.taxStatus ? { ckanTaxStatus: record.taxStatus } : {}),
          ...(record.parcelId ? { ckanParcelId: record.parcelId } : {}),
          ...(record.assessedValue ? { ckanAssessedValue: record.assessedValue } : {}),
          publicVisible: publishPublic,
          ...(publishPublic ? { publicTitle: name } : {}),
          createdAt: now,
          updatedAt: serverTimestamp(),
        })
      }

      setMessage(
        `Added ${chosen.length} ${chosen.length === 1 ? 'record' : 'records'}${
          publishPublic ? ' — now visible on /properties.' : '.'
        }`,
      )
      setSelected({})
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to import records.')
    } finally {
      setIsImporting(false)
    }
  }

  const selectedCount = records.filter((record) => selected[record.sourceId]).length

  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between text-left text-sm font-medium text-white"
      >
        Scan civic records
        <span className="text-grounds-sand">{isOpen ? 'Hide' : 'Show'}</span>
      </button>

      {isOpen ? (
        <div className="mt-4 space-y-4">
          <p className="text-xs leading-6 text-white/50">
            Pull property records from a city&apos;s open civic database, then choose which to add. Selected records
            are saved to the backend; tick &ldquo;Publish&rdquo; to surface them on the public Properties page.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm text-white/70">
              City
              <select
                value={cityId}
                onChange={(event) => setCityId(event.target.value)}
                className="mt-1 w-full rounded-2xl border border-white/10 bg-[#12211c] px-4 py-3 text-white outline-none focus:border-grounds-sand/50"
              >
                {CITIES.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.label}, {city.state}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm text-white/70">
              Search (optional)
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="street, owner, keyword"
                className="mt-1 w-full rounded-2xl border border-white/10 bg-[#12211c] px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-grounds-sand/50"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={scan}
            disabled={isScanning}
            className="rounded-full border border-grounds-sand/45 px-4 py-2 text-sm font-medium text-grounds-sand disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isScanning ? 'Scanning…' : 'Scan records'}
          </button>

          {records.length > 0 ? (
            <>
              <div className="max-h-80 space-y-2 overflow-y-auto rounded-2xl border border-white/10 p-2">
                {records.map((record) => (
                  <label
                    key={record.sourceId}
                    className="flex cursor-pointer items-start gap-3 rounded-xl bg-white/[0.03] p-3 text-sm hover:bg-white/[0.06]"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(selected[record.sourceId])}
                      onChange={() => toggle(record.sourceId)}
                      className="mt-0.5 h-4 w-4 accent-grounds-sand"
                    />
                    <span className="min-w-0">
                      <span className="block font-medium text-white">{record.name || record.address || 'Untitled parcel'}</span>
                      {record.address ? <span className="block text-white/55">{record.address}</span> : null}
                      <span className="mt-0.5 block text-xs text-white/40">
                        {[record.ownerName, record.zoning, record.parcelId].filter(Boolean).join(' · ')}
                      </span>
                    </span>
                  </label>
                ))}
              </div>

              <label className="flex items-center gap-3 text-sm text-white/72">
                <input
                  type="checkbox"
                  checked={publishPublic}
                  onChange={(event) => setPublishPublic(event.target.checked)}
                  className="h-4 w-4 accent-grounds-sand"
                />
                Publish added records to /properties
              </label>

              <button
                type="button"
                onClick={importSelected}
                disabled={isImporting || selectedCount === 0}
                className="rounded-full bg-grounds-sand px-4 py-2 text-sm font-semibold text-[#0b1712] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isImporting ? 'Adding…' : `Add ${selectedCount || ''} selected`.trim()}
              </button>
            </>
          ) : null}

          {message ? <p className="text-sm text-white/66">{message}</p> : null}
        </div>
      ) : null}
    </section>
  )
}
