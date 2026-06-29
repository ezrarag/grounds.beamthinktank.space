'use client'

import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { CITIES } from '@/lib/cities'
import { useCities } from '@/lib/useCities'
import type { BeamAssetStage } from '@/lib/useAcquisitionSites'

type AssetCondition = 'unknown' | 'poor' | 'fair' | 'good' | 'excellent'
type PlanType = 'lease' | 'purchase' | 'bond-financing' | 'grant' | 'revenue-share' | 'management-agreement'
type LocationType =
  | 'venue'
  | 'rehearsal-space'
  | 'performance-venue'
  | 'project-site'
  | 'office'
  | 'civic-anchor'
  | 'field-site'
  | 'property'
  | 'parking'
  | 'other'
type StewardshipStatus = 'unmonitored' | 'observed' | 'stewarded' | 'activated'

const stages: BeamAssetStage[] = ['SIGNAL', 'CLAIM', 'ACCESS', 'STABILIZE', 'ACTIVATE', 'SECURE', 'TRANSFER']
const conditions: AssetCondition[] = ['unknown', 'poor', 'fair', 'good', 'excellent']
const planTypes: PlanType[] = ['lease', 'purchase', 'bond-financing', 'grant', 'revenue-share', 'management-agreement']
const locationTypes: LocationType[] = [
  'venue',
  'rehearsal-space',
  'performance-venue',
  'project-site',
  'office',
  'civic-anchor',
  'field-site',
  'property',
  'parking',
  'other',
]
const stewardshipStatuses: StewardshipStatus[] = ['unmonitored', 'observed', 'stewarded', 'activated']

const initialScores = {
  capacity: 0,
  impact: 0,
  stability: 0,
  revenue: 0,
  partner: 0,
}

const scoreFields: Array<[keyof typeof initialScores, string]> = [
  ['capacity', 'Capacity'],
  ['impact', 'Impact'],
  ['stability', 'Stability'],
  ['revenue', 'Revenue Potential'],
  ['partner', 'Partner Alignment'],
]

function parseCommaList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function optionalNumber(value: string) {
  if (!value.trim()) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function AddPropertyForm() {
  const { cities } = useCities()
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [lat, setLat] = useState<number | undefined>()
  const [lng, setLng] = useState<number | undefined>()
  const [regionId, setRegionId] = useState(CITIES[0]?.id ?? 'milwaukee-wi')
  const [ownerName, setOwnerName] = useState('')
  const [acquisitionStage, setAcquisitionStage] = useState<BeamAssetStage>('SIGNAL')
  const [condition, setCondition] = useState<AssetCondition>('unknown')
  const [locationType, setLocationType] = useState<LocationType>('civic-anchor')
  const [stewardshipStatus, setStewardshipStatus] = useState<StewardshipStatus>('unmonitored')
  const [operatorNarrative, setOperatorNarrative] = useState('')
  const [primaryUseCases, setPrimaryUseCases] = useState('')
  const [heroImageUrl, setHeroImageUrl] = useState('')
  const [publishPublic, setPublishPublic] = useState(false)
  const [publicTitle, setPublicTitle] = useState('')
  const [publicSummary, setPublicSummary] = useState('')
  const [linkedProjectIds, setLinkedProjectIds] = useState('')
  const [scores, setScores] = useState(initialScores)
  const [isFinanceOpen, setIsFinanceOpen] = useState(false)
  const [estimatedCost, setEstimatedCost] = useState('')
  const [planType, setPlanType] = useState<PlanType>('lease')
  const [civicAnchorUse, setCivicAnchorUse] = useState('')
  const [projectedMonthlyRevenue, setProjectedMonthlyRevenue] = useState('')
  const [breakEvenMonths, setBreakEvenMonths] = useState('')
  const [bondFinancingEligible, setBondFinancingEligible] = useState(false)
  const [financeNotes, setFinanceNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const cost = optionalNumber(estimatedCost)
    const revenue = optionalNumber(projectedMonthlyRevenue)

    if (cost !== undefined && revenue !== undefined && revenue > 0) {
      setBreakEvenMonths(String(Math.ceil(cost / revenue)))
    }
  }, [estimatedCost, projectedMonthlyRevenue])

  async function geocodeAddress() {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    const trimmedAddress = address.trim()

    if (!apiKey || !trimmedAddress) return

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(trimmedAddress)}&key=${apiKey}`,
      )
      const payload = (await response.json()) as {
        status?: string
        results?: Array<{ geometry?: { location?: { lat?: number; lng?: number } } }>
      }
      const location = payload.results?.[0]?.geometry?.location

      if (payload.status === 'OK' && typeof location?.lat === 'number' && typeof location.lng === 'number') {
        setLat(location.lat)
        setLng(location.lng)
      }
    } catch {
      // Skip geocoding failures silently so property intake is not blocked.
    }
  }

  function clearForm() {
    setName('')
    setAddress('')
    setLat(undefined)
    setLng(undefined)
    setRegionId(CITIES[0]?.id ?? 'milwaukee-wi')
    setOwnerName('')
    setAcquisitionStage('SIGNAL')
    setCondition('unknown')
    setLocationType('civic-anchor')
    setStewardshipStatus('unmonitored')
    setOperatorNarrative('')
    setPrimaryUseCases('')
    setHeroImageUrl('')
    setPublishPublic(false)
    setPublicTitle('')
    setPublicSummary('')
    setLinkedProjectIds('')
    setScores(initialScores)
    setIsFinanceOpen(false)
    setEstimatedCost('')
    setPlanType('lease')
    setCivicAnchorUse('')
    setProjectedMonthlyRevenue('')
    setBreakEvenMonths('')
    setBondFinancingEligible(false)
    setFinanceNotes('')
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

    if (!trimmedName || !trimmedAddress || !regionId.trim()) {
      setMessage('Name, address, stage, and region are required.')
      return
    }

    const cost = optionalNumber(estimatedCost)
    const revenue = optionalNumber(projectedMonthlyRevenue)
    const months = optionalNumber(breakEvenMonths)
    const now = new Date().toISOString()
    const financePlan = {
      planType,
      ...(cost !== undefined ? { estimatedCost: cost } : {}),
      ...(civicAnchorUse.trim() ? { civicAnchorUse: civicAnchorUse.trim() } : {}),
      ...(revenue !== undefined ? { projectedMonthlyRevenue: revenue } : {}),
      ...(months !== undefined ? { breakEvenMonths: months } : {}),
      bondFinancingEligible,
      ...(financeNotes.trim() ? { notes: financeNotes.trim() } : {}),
    }

    setIsSaving(true)

    try {
      await addDoc(collection(db, 'beamAssets'), {
        name: trimmedName,
        address: trimmedAddress,
        ...(lat !== undefined ? { lat } : {}),
        ...(lng !== undefined ? { lng } : {}),
        regionId: regionId.trim(),
        city: cities.find((item) => item.id === regionId)?.label ?? regionId.trim(),
        ownerName: ownerName.trim(),
        acquisitionStage,
        condition,
        locationType,
        stewardshipStatus,
        operatorNarrative: operatorNarrative.trim(),
        primaryUseCases: parseCommaList(primaryUseCases),
        ...(heroImageUrl.trim() ? { heroImageUrl: heroImageUrl.trim() } : {}),
        publicVisible: publishPublic,
        ...(publishPublic
          ? {
              publicTitle: (publicTitle.trim() || trimmedName),
              publicSummary: (publicSummary.trim() || operatorNarrative.trim()),
              publicNarrative: (publicSummary.trim() || operatorNarrative.trim()),
            }
          : {}),
        scores,
        stageHistory: [{ stage: acquisitionStage, timestamp: now, note: 'Initial entry' }],
        linkedProjectIds: parseCommaList(linkedProjectIds),
        linkedActionIds: [],
        financePlan,
        createdAt: now,
        updatedAt: serverTimestamp(),
      })
      setMessage(`Added — ${trimmedName}`)
      clearForm()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to add property.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-white">Add property</p>
        <button type="button" onClick={clearForm} className="text-sm font-medium text-grounds-sand hover:text-white">
          Clear
        </button>
      </div>

      <input type="hidden" value={lat ?? ''} readOnly />
      <input type="hidden" value={lng ?? ''} readOnly />

      <div className="mt-4 grid gap-3">
        <label className="block text-sm text-white/70">
          Name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            className="mt-1 w-full rounded-2xl border border-white/10 bg-[#12211c] px-4 py-3 text-white outline-none focus:border-grounds-sand/50"
          />
        </label>

        <label className="block text-sm text-white/70">
          Address
          <input
            value={address}
            onBlur={geocodeAddress}
            onChange={(event) => setAddress(event.target.value)}
            required
            className="mt-1 w-full rounded-2xl border border-white/10 bg-[#12211c] px-4 py-3 text-white outline-none focus:border-grounds-sand/50"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm text-white/70">
            Acquisition stage
            <select
              value={acquisitionStage}
              onChange={(event) => setAcquisitionStage(event.target.value as BeamAssetStage)}
              required
              className="mt-1 w-full rounded-2xl border border-white/10 bg-[#12211c] px-4 py-3 text-white outline-none focus:border-grounds-sand/50"
            >
              {stages.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm text-white/70">
            City
            <select
              value={regionId}
              onChange={(event) => setRegionId(event.target.value)}
              required
              className="mt-1 w-full rounded-2xl border border-white/10 bg-[#12211c] px-4 py-3 text-white outline-none focus:border-grounds-sand/50"
            >
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.label}, {city.state}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm text-white/70">
            Owner name
            <input
              value={ownerName}
              onChange={(event) => setOwnerName(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-white/10 bg-[#12211c] px-4 py-3 text-white outline-none focus:border-grounds-sand/50"
            />
          </label>

          <label className="block text-sm text-white/70">
            Condition
            <select
              value={condition}
              onChange={(event) => setCondition(event.target.value as AssetCondition)}
              className="mt-1 w-full rounded-2xl border border-white/10 bg-[#12211c] px-4 py-3 text-white outline-none focus:border-grounds-sand/50"
            >
              {conditions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm text-white/70">
            Location type
            <select
              value={locationType}
              onChange={(event) => setLocationType(event.target.value as LocationType)}
              className="mt-1 w-full rounded-2xl border border-white/10 bg-[#12211c] px-4 py-3 text-white outline-none focus:border-grounds-sand/50"
            >
              {locationTypes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm text-white/70">
            Stewardship status
            <select
              value={stewardshipStatus}
              onChange={(event) => setStewardshipStatus(event.target.value as StewardshipStatus)}
              className="mt-1 w-full rounded-2xl border border-white/10 bg-[#12211c] px-4 py-3 text-white outline-none focus:border-grounds-sand/50"
            >
              {stewardshipStatuses.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block text-sm text-white/70">
          Operator narrative
          <textarea
            value={operatorNarrative}
            onChange={(event) => setOperatorNarrative(event.target.value)}
            rows={3}
            className="mt-1 w-full rounded-2xl border border-white/10 bg-[#12211c] px-4 py-3 text-white outline-none focus:border-grounds-sand/50"
          />
        </label>

        <label className="block text-sm text-white/70">
          Primary use cases
          <input
            value={primaryUseCases}
            onChange={(event) => setPrimaryUseCases(event.target.value)}
            placeholder="food hub, training space, clinic"
            className="mt-1 w-full rounded-2xl border border-white/10 bg-[#12211c] px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-grounds-sand/50"
          />
        </label>

        <label className="block text-sm text-white/70">
          Hero image URL
          <input
            value={heroImageUrl}
            onChange={(event) => setHeroImageUrl(event.target.value)}
            placeholder="https://… (manage a full gallery after saving)"
            className="mt-1 w-full rounded-2xl border border-white/10 bg-[#12211c] px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-grounds-sand/50"
          />
        </label>

        <label className="block text-sm text-white/70">
          Linked project IDs
          <input
            value={linkedProjectIds}
            onChange={(event) => setLinkedProjectIds(event.target.value)}
            placeholder="project-1, project-2"
            className="mt-1 w-full rounded-2xl border border-white/10 bg-[#12211c] px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-grounds-sand/50"
          />
        </label>

        <div className="rounded-[1.25rem] border border-white/10 bg-[#12211c] p-4">
          <label className="flex items-center gap-3 text-sm font-medium text-white">
            <input
              type="checkbox"
              checked={publishPublic}
              onChange={(event) => setPublishPublic(event.target.checked)}
              className="h-4 w-4 accent-grounds-sand"
            />
            Publish to public /properties now
          </label>
          <p className="mt-2 text-xs leading-6 text-white/50">
            When on, this property appears on the public Properties page immediately.
          </p>

          {publishPublic ? (
            <div className="mt-4 grid gap-3">
              <label className="block text-sm text-white/70">
                Public title
                <input
                  value={publicTitle}
                  onChange={(event) => setPublicTitle(event.target.value)}
                  placeholder="Defaults to the property name"
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-[#0b1712] px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-grounds-sand/50"
                />
              </label>
              <label className="block text-sm text-white/70">
                Public summary
                <textarea
                  value={publicSummary}
                  onChange={(event) => setPublicSummary(event.target.value)}
                  rows={3}
                  placeholder="Short public-facing narrative"
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-[#0b1712] px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-grounds-sand/50"
                />
              </label>
            </div>
          ) : null}
        </div>

        <div className="rounded-[1.25rem] border border-white/10 bg-[#12211c] p-4">
          <p className="text-sm font-medium text-white">Scores</p>
          <div className="mt-4 space-y-4">
            {scoreFields.map(([key, label]) => (
              <label key={key} className="grid gap-2 text-sm text-white/70">
                <span className="flex items-center justify-between gap-3">
                  {label}
                  <span className="font-semibold text-white">{scores[key]}</span>
                </span>
                <input
                  type="range"
                  min={0}
                  max={5}
                  step={1}
                  value={scores[key]}
                  onChange={(event) =>
                    setScores((current) => ({
                      ...current,
                      [key]: Number(event.target.value),
                    }))
                  }
                  className="w-full accent-grounds-sand"
                />
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-[1.25rem] border border-white/10 bg-[#12211c] p-4">
          <button
            type="button"
            onClick={() => setIsFinanceOpen((current) => !current)}
            className="flex w-full items-center justify-between text-left text-sm font-medium text-white"
          >
            Finance projection
            <span className="text-grounds-sand">{isFinanceOpen ? 'Hide' : 'Show'}</span>
          </button>

          {isFinanceOpen ? (
            <div className="mt-4 grid gap-3">
              <label className="block text-sm text-white/70">
                Estimated acquisition/lease cost ($)
                <input
                  type="number"
                  min={0}
                  value={estimatedCost}
                  onChange={(event) => setEstimatedCost(event.target.value)}
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-[#0b1712] px-4 py-3 text-white outline-none focus:border-grounds-sand/50"
                />
              </label>

              <label className="block text-sm text-white/70">
                Plan type
                <select
                  value={planType}
                  onChange={(event) => setPlanType(event.target.value as PlanType)}
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-[#0b1712] px-4 py-3 text-white outline-none focus:border-grounds-sand/50"
                >
                  {planTypes.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm text-white/70">
                Civic anchor use (ground floor)
                <input
                  value={civicAnchorUse}
                  onChange={(event) => setCivicAnchorUse(event.target.value)}
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-[#0b1712] px-4 py-3 text-white outline-none focus:border-grounds-sand/50"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm text-white/70">
                  Projected monthly revenue
                  <input
                    type="number"
                    min={0}
                    value={projectedMonthlyRevenue}
                    onChange={(event) => setProjectedMonthlyRevenue(event.target.value)}
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-[#0b1712] px-4 py-3 text-white outline-none focus:border-grounds-sand/50"
                  />
                </label>

                <label className="block text-sm text-white/70">
                  Break-even months
                  <input
                    type="number"
                    min={0}
                    value={breakEvenMonths}
                    onChange={(event) => setBreakEvenMonths(event.target.value)}
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-[#0b1712] px-4 py-3 text-white outline-none focus:border-grounds-sand/50"
                  />
                </label>
              </div>

              <label className="flex items-center gap-3 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={bondFinancingEligible}
                  onChange={(event) => setBondFinancingEligible(event.target.checked)}
                  className="h-4 w-4 accent-grounds-sand"
                />
                Bond financing eligible
              </label>

              <label className="block text-sm text-white/70">
                Notes
                <textarea
                  value={financeNotes}
                  onChange={(event) => setFinanceNotes(event.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-[#0b1712] px-4 py-3 text-white outline-none focus:border-grounds-sand/50"
                />
              </label>
            </div>
          ) : null}
        </div>
      </div>

      <button
        type="submit"
        disabled={isSaving}
        className="mt-4 rounded-full bg-grounds-sand px-5 py-3 text-sm font-semibold text-[#0b1712] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSaving ? 'Adding...' : 'Add property'}
      </button>
      {message ? <p className="mt-3 text-sm text-white/66">{message}</p> : null}
    </form>
  )
}
