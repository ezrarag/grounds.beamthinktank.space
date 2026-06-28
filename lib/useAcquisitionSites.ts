'use client'

import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'

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
