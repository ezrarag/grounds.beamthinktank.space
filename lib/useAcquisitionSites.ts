'use client'

import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { MediaItem } from '@/lib/media'

import type { AcquisitionTrackId, ProductionLane } from '@/lib/tracks'

export type BeamAssetStage =
  | 'SIGNAL'
  | 'CLAIM'
  | 'ACCESS'
  | 'STABILIZE'
  | 'ACTIVATE'
  | 'SECURE'
  | 'TRANSFER'

export interface BeamAssetStageHistoryItem {
  stage: BeamAssetStage
  timestamp: string
  note: string
}

export interface BeamAsset {
  id: string
  name: string
  address: string
  publicVisible?: boolean
  acquisitionTrack?: AcquisitionTrackId
  productionLane?: ProductionLane
  suggestedBy?: {
    name: string
    affiliation?: string
    note?: string
  }
  publicNarrative?: string
  cohortUses?: string[]
  lat?: number
  lng?: number
  regionId: string
  ownerName: string
  acquisitionStage: BeamAssetStage
  condition: 'unknown' | 'poor' | 'fair' | 'good' | 'excellent'
  operatorNarrative: string
  primaryUseCases: string[]
  scores: {
    capacity: number
    impact: number
    stability: number
    revenue: number
    partner: number
  }
  stageHistory: BeamAssetStageHistoryItem[]
  linkedProjectIds: string[]
  linkedActionIds: string[]
  ngoLinks?: Array<{
    ngoId: string
    ngoName: string
    ngoSubdomain: string
    relationshipType: string
    linkedAt: string
  }>
  cohortPool?: 'acquisition' | 'financing' | 'cohort' | 'civic' | 'all'
  // Friendly city label (regionId is the canonical city id). See lib/cities.ts.
  city?: string
  // Media (see lib/media.ts): a hero image plus an ordered gallery.
  heroImageUrl?: string
  media?: MediaItem[]
  // Public-facing display overrides (fall back to name / publicNarrative).
  publicTitle?: string
  publicSummary?: string
  // Civic intelligence fields surfaced on the public GroundsSiteCard.
  locationType?:
    | 'venue'
    | 'rehearsal-space'
    | 'performance-venue'
    | 'project-site'
    | 'office'
    | 'civic-anchor'
    | 'field-site'
    | 'property'
    | 'parking'
    | 'retail'
    | 'warehouse'
    | 'industrial'
    | 'studio'
    | 'recording-studio'
    | 'mixed-use'
    | 'other'
  stewardshipStatus?: 'unmonitored' | 'observed' | 'stewarded' | 'activated'
  civicLiabilities?: Array<{
    type: string
    description: string
    reportedAt: string
    reportedBy: string
    beamResponseStatus: 'noted' | 'engaged' | 'resolved'
  }>
  workLog?: Array<{
    workType: string
    note: string
    mediaUrls: string[]
    civicImplication: string
    loggedBy: string
    loggedAt: string
    lat: number
    lng: number
  }>
  tenants?: Array<{
    name: string
    category: string
    status: 'current' | 'historical'
    websiteUrl: string
    notes: string
  }>
  parcelPermits?: string[]
  // Optional CKAN-sourced parcel intel (populated by lookup).
  ckanOwnerName?: string
  ckanAssessedValue?: string | number
  ckanZoning?: string
  ckanTaxStatus?: string
  ckanParcelId?: string
  financePlan?: {
    planType: string
    estimatedCost?: number
    civicAnchorUse?: string
    projectedMonthlyRevenue?: number
    breakEvenMonths?: number
    bondFinancingEligible?: boolean
    notes?: string
  }
  appraisalData?: {
    estimatedValue: number
    repairCostEstimate: number
    lienStatus: string
    source: string
    confidence: number
    updatedBy?: string
    updatedAt?: string
  }
  createdAt: string
  updatedAt: string
}

export function useAcquisitionSites(): {
  sites: BeamAsset[]
  loading: boolean
  error: string | null
} {
  const [sites, setSites] = useState<BeamAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!db) {
      setLoading(false)
      setError('Firebase is not configured.')
      return () => undefined
    }

    const unsubscribe = onSnapshot(
      collection(db, 'beamAssets'),
      (snapshot) => {
        setSites(
          snapshot.docs.map((doc) => ({
            ...(doc.data() as Omit<BeamAsset, 'id'>),
            id: doc.id,
          })),
        )
        setError(null)
        setLoading(false)
      },
      (snapshotError) => {
        setError(snapshotError.message)
        setLoading(false)
      },
    )

    return unsubscribe
  }, [])

  return {
    sites,
    loading,
    error,
  }
}

export function usePublicAcquisitionSites(): {
  sites: BeamAsset[]
  loading: boolean
  error: string | null
} {
  const [sites, setSites] = useState<BeamAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!db) {
      setLoading(false)
      setError('Firebase is not configured.')
      return () => undefined
    }

    const unsubscribe = onSnapshot(
      query(collection(db, 'beamAssets'), where('publicVisible', '==', true)),
      (snapshot) => {
        setSites(
          snapshot.docs.map((doc) => ({
            ...(doc.data() as Omit<BeamAsset, 'id'>),
            id: doc.id,
          })),
        )
        setError(null)
        setLoading(false)
      },
      (snapshotError) => {
        setError(snapshotError.message)
        setLoading(false)
      },
    )

    return unsubscribe
  }, [])

  return {
    sites,
    loading,
    error,
  }
}

/** Defaulting helper: existing assets without acquisitionTrack are treated as Track C. */
export function getAssetTrack(asset: Partial<BeamAsset>): AcquisitionTrackId {
  return asset.acquisitionTrack || 'C'
}

/** Enforces immutability of acquisitionTrack after SECURE stage. */
export function isTrackImmutable(stage?: BeamAssetStage): boolean {
  return stage === 'SECURE' || stage === 'TRANSFER'
}

/**
 * Refactored stage maturation helper: evaluates mapped kernel signals,
 * emits them non-blockingly, and updates Firestore.
 */
export async function advanceStage(
  asset: BeamAsset,
  targetStage: BeamAssetStage,
  note?: string,
): Promise<void> {
  const { evaluateGroundsStageTransition } = await import('@/lib/kernel/rules/grounds')
  const { emitSignal } = await import('@/lib/kernel/emit')

  // 1. Evaluate and emit signals out-of-band
  const signals = evaluateGroundsStageTransition(asset, targetStage)
  for (const sig of signals) {
    void emitSignal(sig)
  }

  // 2. Update Firestore if configured
  if (db) {
    const { doc, updateDoc } = await import('firebase/firestore')
    const assetRef = doc(db, 'beamAssets', asset.id)
    const newHistory = [
      ...(asset.stageHistory || []),
      {
        stage: targetStage,
        timestamp: new Date().toISOString(),
        note: note || `Advanced to ${targetStage} stage.`,
      },
    ]
    await updateDoc(assetRef, {
      acquisitionStage: targetStage,
      stageHistory: newHistory,
      updatedAt: new Date().toISOString(),
    })
  }
}


