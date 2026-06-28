import { NextResponse } from 'next/server'
import { getCity, type CivicField, type CityConfig, type CivicRecord } from '@/lib/cities'

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

function pickField(raw: Record<string, unknown>, field: CivicField, source: CityConfig): string {
  const lower: Record<string, unknown> = {}
  for (const key of Object.keys(raw)) lower[key.toLowerCase()] = raw[key]

  const mapped = source.dataSource.fieldMap?.[field]
  const keys = mapped ? [mapped.toLowerCase(), ...FIELD_CANDIDATES[field]] : FIELD_CANDIDATES[field]

  for (const key of keys) {
    const value = lower[key]
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim()
    }
  }
  return ''
}

function normalize(raw: Record<string, unknown>, source: CityConfig, index: number): CivicRecord {
  return {
    sourceId: pickField(raw, 'sourceId', source) || String(index),
    name: pickField(raw, 'name', source),
    address: pickField(raw, 'address', source),
    ownerName: pickField(raw, 'ownerName', source),
    zoning: pickField(raw, 'zoning', source),
    taxStatus: pickField(raw, 'taxStatus', source),
    parcelId: pickField(raw, 'parcelId', source),
    assessedValue: pickField(raw, 'assessedValue', source),
  }
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const cityId = searchParams.get('city') ?? ''
  const q = searchParams.get('q')?.trim() ?? ''
  const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 25, 1), 100)

  const city = getCity(cityId)
  if (!city) {
    return NextResponse.json({ error: `Unknown city: ${cityId || '(none)'}` }, { status: 400 })
  }

  const { dataSource } = city
  if (dataSource.type === 'none' || !dataSource.baseUrl) {
    return NextResponse.json(
      { error: `No civic data source configured for ${city.label}. Use manual import for now.` },
      { status: 422 },
    )
  }

  const resourceId = dataSource.resourceEnv ? process.env[dataSource.resourceEnv] : undefined
  if (!resourceId) {
    return NextResponse.json(
      {
        error: `${city.label} dataset id is not set. Configure the ${dataSource.resourceEnv} environment variable to enable live scans.`,
      },
      { status: 422 },
    )
  }

  const appToken = dataSource.appTokenEnv ? process.env[dataSource.appTokenEnv] : undefined

  try {
    const raw =
      dataSource.type === 'ckan'
        ? await fetchCkan(dataSource.baseUrl, resourceId, q, limit)
        : await fetchSocrata(dataSource.baseUrl, resourceId, q, limit, appToken)

    const records = raw.map((item, index) => normalize(item, city, index))
    return NextResponse.json({ city: city.id, cityLabel: city.label, count: records.length, records })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Civic data request failed.' },
      { status: 502 },
    )
  }
}
