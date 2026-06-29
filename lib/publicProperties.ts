import 'server-only'

import { seededPublicProperties } from '@/lib/publicPropertySeeds'
import type { BeamAsset } from '@/lib/useAcquisitionSites'
import { getPropertySlug } from '@/lib/propertySlugs'

interface FirestoreValue {
  stringValue?: string
  integerValue?: string
  doubleValue?: number
  booleanValue?: boolean
  nullValue?: null
  timestampValue?: string
  mapValue?: {
    fields?: Record<string, FirestoreValue>
  }
  arrayValue?: {
    values?: FirestoreValue[]
  }
}

interface FirestoreDocument {
  name: string
  fields?: Record<string, FirestoreValue>
}

function getEnv(name: string) {
  const value = process.env[name]
  return value && value !== 'undefined' ? value : null
}

function firestoreBaseUrl() {
  const projectId = getEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID')
  const apiKey = getEnv('NEXT_PUBLIC_FIREBASE_API_KEY')

  if (!projectId || !apiKey) {
    return null
  }

  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`
}

function documentIdFromName(name: string) {
  return name.split('/').pop() ?? name
}

function unwrapValue(value: FirestoreValue | undefined): unknown {
  if (!value) return null
  if (value.stringValue !== undefined) return value.stringValue
  if (value.integerValue !== undefined) return Number(value.integerValue)
  if (value.doubleValue !== undefined) return value.doubleValue
  if (value.booleanValue !== undefined) return value.booleanValue
  if (value.timestampValue !== undefined) return value.timestampValue
  if (value.nullValue !== undefined) return null
  if (value.arrayValue) return (value.arrayValue.values ?? []).map((item) => unwrapValue(item))

  if (value.mapValue) {
    return Object.fromEntries(
      Object.entries(value.mapValue.fields ?? {}).map(([key, item]) => [key, unwrapValue(item)]),
    )
  }

  return null
}

function asRecord(value: unknown) {
  return typeof value === 'object' && value ? (value as Record<string, unknown>) : {}
}

async function fetchBeamAssets() {
  const baseUrl = firestoreBaseUrl()
  const apiKey = getEnv('NEXT_PUBLIC_FIREBASE_API_KEY')

  if (!baseUrl || !apiKey) {
    return seededPublicProperties
  }

  const response = await fetch(`${baseUrl}/beamAssets?key=${apiKey}`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Firestore request failed for beamAssets: ${response.status}`)
  }

  const payload = (await response.json()) as { documents?: FirestoreDocument[] }
  return payload.documents ?? []
}

function parseString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function parseStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function parseBeamAsset(document: FirestoreDocument): BeamAsset {
  const fields = Object.fromEntries(
    Object.entries(document.fields ?? {}).map(([key, value]) => [key, unwrapValue(value)]),
  )

  const financePlan = asRecord(fields.financePlan)

  return {
    id: documentIdFromName(document.name),
    name: parseString(fields.name),
    publicTitle: typeof fields.publicTitle === 'string' ? fields.publicTitle : undefined,
    publicSummary: typeof fields.publicSummary === 'string' ? fields.publicSummary : undefined,
    address: parseString(fields.address),
    publicVisible: fields.publicVisible === true,
    suggestedBy: asRecord(fields.suggestedBy) as BeamAsset['suggestedBy'],
    publicNarrative: typeof fields.publicNarrative === 'string' ? fields.publicNarrative : undefined,
    cohortUses: parseStringArray(fields.cohortUses),
    lat: typeof fields.lat === 'number' ? fields.lat : undefined,
    lng: typeof fields.lng === 'number' ? fields.lng : undefined,
    regionId: parseString(fields.regionId),
    ownerName: parseString(fields.ownerName),
    acquisitionStage: (typeof fields.acquisitionStage === 'string' ? fields.acquisitionStage : 'SIGNAL') as BeamAsset['acquisitionStage'],
    condition: (typeof fields.condition === 'string' ? fields.condition : 'unknown') as BeamAsset['condition'],
    operatorNarrative: parseString(fields.operatorNarrative),
    primaryUseCases: parseStringArray(fields.primaryUseCases),
    scores: (asRecord(fields.scores) as BeamAsset['scores']) || {
      capacity: 0,
      impact: 0,
      stability: 0,
      revenue: 0,
      partner: 0,
    },
    stageHistory: Array.isArray(fields.stageHistory) ? (fields.stageHistory as BeamAsset['stageHistory']) : [],
    linkedProjectIds: parseStringArray(fields.linkedProjectIds),
    linkedActionIds: parseStringArray(fields.linkedActionIds),
    ngoLinks: Array.isArray(fields.ngoLinks) ? (fields.ngoLinks as BeamAsset['ngoLinks']) : [],
    cohortPool: typeof fields.cohortPool === 'string' ? (fields.cohortPool as BeamAsset['cohortPool']) : undefined,
    locationType: typeof fields.locationType === 'string' ? (fields.locationType as BeamAsset['locationType']) : undefined,
    stewardshipStatus:
      typeof fields.stewardshipStatus === 'string' ? (fields.stewardshipStatus as BeamAsset['stewardshipStatus']) : undefined,
    civicLiabilities: Array.isArray(fields.civicLiabilities) ? (fields.civicLiabilities as BeamAsset['civicLiabilities']) : [],
    workLog: Array.isArray(fields.workLog) ? (fields.workLog as BeamAsset['workLog']) : [],
    tenants: Array.isArray(fields.tenants) ? (fields.tenants as BeamAsset['tenants']) : [],
    parcelPermits: parseStringArray(fields.parcelPermits),
    ckanOwnerName: typeof fields.ckanOwnerName === 'string' ? fields.ckanOwnerName : undefined,
    ckanAssessedValue:
      typeof fields.ckanAssessedValue === 'string' || typeof fields.ckanAssessedValue === 'number'
        ? fields.ckanAssessedValue
        : undefined,
    ckanZoning: typeof fields.ckanZoning === 'string' ? fields.ckanZoning : undefined,
    ckanTaxStatus: typeof fields.ckanTaxStatus === 'string' ? fields.ckanTaxStatus : undefined,
    ckanParcelId: typeof fields.ckanParcelId === 'string' ? fields.ckanParcelId : undefined,
    financePlan:
      Object.keys(financePlan).length > 0
        ? {
            planType: parseString(financePlan.planType),
            estimatedCost: typeof financePlan.estimatedCost === 'number' ? financePlan.estimatedCost : undefined,
            civicAnchorUse: typeof financePlan.civicAnchorUse === 'string' ? financePlan.civicAnchorUse : undefined,
            projectedMonthlyRevenue:
              typeof financePlan.projectedMonthlyRevenue === 'number' ? financePlan.projectedMonthlyRevenue : undefined,
            breakEvenMonths: typeof financePlan.breakEvenMonths === 'number' ? financePlan.breakEvenMonths : undefined,
            bondFinancingEligible: financePlan.bondFinancingEligible === true,
            notes: typeof financePlan.notes === 'string' ? financePlan.notes : undefined,
          }
        : undefined,
    createdAt: parseString(fields.createdAt),
    updatedAt: parseString(fields.updatedAt),
  }
}

export async function getPublicProperties() {
  const docs = await fetchBeamAssets()
  const sites = docs.map(parseBeamAsset).filter((site) => site.publicVisible)
  return sites.length > 0 ? sites : seededPublicProperties
}

export async function getPublicPropertyBySlug(slug: string) {
  const properties = await getPublicProperties()
  return properties.find((site) => getPropertySlug(site) === slug) ?? null
}
