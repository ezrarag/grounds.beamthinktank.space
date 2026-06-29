import { NextResponse } from 'next/server'
import { getCity, type CivicField, type CivicRecord, type CivicSourceType } from '@/lib/cities'

export const runtime = 'nodejs'

// Candidate raw keys tried when no explicit fieldMap entry exists. Civic
// datasets name things inconsistently, so we probe several common variants.
const FIELD_CANDIDATES: Record<CivicField, string[]> = {
  sourceId: ['_id', 'id', 'objectid', 'taxkey', 'parcel_id', 'pin'],
  name: ['name', 'property_name', 'building_name', 'owner_name_1', 'owner', 'site_name'],
  address: ['address', 'full_address', 'situs_address', 'property_address', 'geo_address', 'house_address'],
  ownerName: ['owner_name_1', 'owner_name', 'owner', 'taxpayer', 'taxpayer_name'],
  zoning: ['zoning', 'zone', 'zoning_code', 'zone_class'],
  taxStatus: ['tax_status', 'tax_rate_cd', 'tax_exempt', 'exempt'],
  parcelId: ['taxkey', 'parcel_id', 'pin', 'parcel', 'parcelid'],
  assessedValue: ['assessed_value', 'c_a_total', 'total_assessed_value', 'assessment', 'total_value'],
}

type FieldMap = Partial<Record<CivicField, string>>

function pickField(raw: Record<string, unknown>, field: CivicField, fieldMap?: FieldMap): string {
  const lower: Record<string, unknown> = {}
  for (const key of Object.keys(raw)) lower[key.toLowerCase()] = raw[key]

  const mapped = fieldMap?.[field]
  const keys = mapped ? [mapped.toLowerCase(), ...FIELD_CANDIDATES[field]] : FIELD_CANDIDATES[field]

  for (const key of keys) {
    const value = lower[key]
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim()
    }
  }
  return ''
}

function normalize(raw: Record<string, unknown>, fieldMap: FieldMap | undefined, index: number): CivicRecord {
  return {
    sourceId: pickField(raw, 'sourceId', fieldMap) || String(index),
    name: pickField(raw, 'name', fieldMap),
    address: pickField(raw, 'address', fieldMap),
    ownerName: pickField(raw, 'ownerName', fieldMap),
    zoning: pickField(raw, 'zoning', fieldMap),
    taxStatus: pickField(raw, 'taxStatus', fieldMap),
    parcelId: pickField(raw, 'parcelId', fieldMap),
    assessedValue: pickField(raw, 'assessedValue', fieldMap),
  }
}

// Block non-https and private/loopback hosts (admin-only, but defense in depth).
function isSafeBaseUrl(value: string): boolean {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return false
  }
  if (url.protocol !== 'https:') return false
  const host = url.hostname
  if (host === 'localhost' || host.endsWith('.local')) return false
  if (/^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(host)) return false
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return false
  return true
}

async function fetchCkan(base: string, resourceId: string, q: string, limit: number) {
  const url = new URL(`${base.replace(/\/$/, '')}/api/3/action/datastore_search`)
  url.searchParams.set('resource_id', resourceId)
  url.searchParams.set('limit', String(limit))
  if (q) url.searchParams.set('q', q)

  const response = await fetch(url, { headers: { accept: 'application/json' } })
  if (!response.ok) throw new Error(`CKAN request failed (${response.status})`)
  const json = (await response.json()) as { result?: { records?: Record<string, unknown>[] } }
  return json.result?.records ?? []
}

async function fetchSocrata(base: string, datasetId: string, q: string, limit: number, appToken?: string) {
  const url = new URL(`${base.replace(/\/$/, '')}/resource/${datasetId}.json`)
  url.searchParams.set('$limit', String(limit))
  if (q) url.searchParams.set('$q', q)

  const response = await fetch(url, {
    headers: appToken ? { accept: 'application/json', 'X-App-Token': appToken } : { accept: 'application/json' },
  })
  if (!response.ok) throw new Error(`Socrata request failed (${response.status})`)
  return (await response.json()) as Record<string, unknown>[]
}

interface ProvidedSource {
  type?: CivicSourceType
  baseUrl?: string
  resourceId?: string
  fieldMap?: FieldMap
}

interface CivicRequestBody {
  cityId?: string
  q?: string
  limit?: number
  source?: ProvidedSource
}

export async function POST(request: Request) {
  const body = ((await request.json().catch(() => null)) ?? {}) as CivicRequestBody
  const cityId = body.cityId ?? ''
  const q = (body.q ?? '').trim()
  const limit = Math.min(Math.max(Number(body.limit) || 25, 1), 100)

  const builtin = getCity(cityId)
  const provided = body.source

  // Resolve the effective data source: an admin-managed city sends its config
  // inline; a built-in city resolves its dataset id (and token) from env.
  let type: CivicSourceType | undefined
  let baseUrl: string | undefined
  let resourceId: string | undefined
  let fieldMap: FieldMap | undefined
  let appToken: string | undefined
  let label = builtin?.label ?? cityId

  if (provided?.baseUrl && provided?.resourceId) {
    type = provided.type ?? 'ckan'
    baseUrl = provided.baseUrl
    resourceId = provided.resourceId
    fieldMap = provided.fieldMap
    appToken = type === 'socrata' ? process.env.CIVIC_SOCRATA_APP_TOKEN : undefined
  } else if (builtin) {
    const ds = builtin.dataSource
    type = ds.type
    baseUrl = ds.baseUrl
    fieldMap = ds.fieldMap
    resourceId = ds.resourceId ?? (ds.resourceEnv ? process.env[ds.resourceEnv] : undefined)
    appToken = ds.appTokenEnv ? process.env[ds.appTokenEnv] : undefined
    label = builtin.label
  } else {
    return NextResponse.json({ error: `Unknown city: ${cityId || '(none)'}` }, { status: 400 })
  }

  if (type === 'none' || !baseUrl) {
    return NextResponse.json({ error: `No civic data source configured for ${label}.` }, { status: 422 })
  }
  if (!resourceId) {
    return NextResponse.json(
      { error: `${label} has no dataset id yet. Add one in the city registry (or its env var).` },
      { status: 422 },
    )
  }
  if (!isSafeBaseUrl(baseUrl)) {
    return NextResponse.json({ error: 'Data source URL must be a public https endpoint.' }, { status: 400 })
  }

  try {
    const raw =
      type === 'ckan'
        ? await fetchCkan(baseUrl, resourceId, q, limit)
        : await fetchSocrata(baseUrl, resourceId, q, limit, appToken)

    const records = raw.map((item, index) => normalize(item, fieldMap, index))
    return NextResponse.json({ city: cityId, cityLabel: label, count: records.length, records })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Civic data request failed.' },
      { status: 502 },
    )
  }
}
