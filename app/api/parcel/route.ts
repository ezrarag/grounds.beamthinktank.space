import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export interface AppraisalHistoryItem {
  year: number
  assessedValue: number
  landValue?: number
  improvementValue?: number
  event?: string
}

export interface ParcelResult {
  found: boolean
  address: string
  ownerName: string
  zoning: string
  parcelId: string
  assessedValue: string
  lat?: number
  lng?: number
  geometry?: any // GeoJSON Feature or Geometry (Polygon / MultiPolygon)
  source?: 'regrid' | 'civic-fallback' | 'seed'
  sqft_structure?: number
  sqft_lot?: number
  tax_lien_status?: 'Clean / Current' | 'Notice of Delinquency' | 'Eligible for In-Rem Foreclosure' | 'Tax Certificate Sale'
  delinquent_tax_amount?: number
  zoning_code?: string
  zoning_description?: string
  appraisal_history?: AppraisalHistoryItem[]
}

function pick(fields: Record<string, unknown>, keys: string[]): string {
  const lower: Record<string, unknown> = {}
  for (const key of Object.keys(fields)) lower[key.toLowerCase()] = fields[key]
  for (const key of keys) {
    const value = lower[key]
    if (value !== undefined && value !== null && String(value).trim() !== '') return String(value).trim()
  }
  return ''
}

function pickNumber(fields: Record<string, unknown>, keys: string[]): number | undefined {
  const raw = pick(fields, keys)
  const n = Number(raw)
  return Number.isFinite(n) ? n : undefined
}

// Known Milwaukee seed site coordinates and parcel geometry generators
const SEED_SITE_COORDS: Record<
  string,
  {
    lat: number
    lng: number
    parcelId: string
    ownerName: string
    zoning: string
    assessedValue: string
    sqft_structure?: number
    sqft_lot?: number
    zoning_code?: string
    zoning_description?: string
  }
> = {
  '639 n 25th st': {
    lat: 43.0396,
    lng: -87.945,
    parcelId: '388-1204-000',
    ownerName: 'United Methodist Church of Wisconsin',
    zoning: 'RT4 - Two-Family Residential',
    assessedValue: '$1,250,000',
    sqft_structure: 14500,
    sqft_lot: 22000,
    zoning_code: 'RT4',
    zoning_description: 'Two-Family Residential District',
  },
  '800 w wells st': {
    lat: 43.0408,
    lng: -87.922,
    parcelId: '392-0501-100',
    ownerName: 'Milwaukee County',
    zoning: 'C9A - Central Business Core',
    assessedValue: '$18,500,000',
    sqft_structure: 85000,
    sqft_lot: 110000,
    zoning_code: 'C9A',
    zoning_description: 'Civic & Commercial Center District',
  },
  '814 w wisconsin ave': {
    lat: 43.0388,
    lng: -87.9225,
    parcelId: '392-0520-000',
    ownerName: 'City of Milwaukee',
    zoning: 'C9B - Downtown Mixed-Use',
    assessedValue: '$14,200,000',
    sqft_structure: 62000,
    sqft_lot: 75000,
    zoning_code: 'C9B',
    zoning_description: 'Downtown Mixed-Use & Cultural Core',
  },
}

function buildSyntheticParcelGeometry(lng: number, lat: number) {
  const dLng = 0.00045
  const dLat = 0.00035
  return {
    type: 'Polygon',
    coordinates: [
      [
        [lng - dLng, lat - dLat],
        [lng + dLng, lat - dLat],
        [lng + dLng, lat + dLat],
        [lng - dLng, lat + dLat],
        [lng - dLng, lat - dLat],
      ],
    ],
  }
}

// Regrid nationwide parcel lookup by address or parcelId.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')?.trim() || searchParams.get('q')?.trim()
  const parcelId = searchParams.get('parcelId')?.trim()

  if (!address && !parcelId) {
    return NextResponse.json({ error: 'An address or parcelId is required.' }, { status: 400 })
  }

  const queryStr = address || parcelId || ''
  const token = process.env.REGRID_API_TOKEN

  if (token) {
    const url = `https://app.regrid.com/api/v2/parcels/address?query=${encodeURIComponent(queryStr)}&limit=1&token=${token}`

    try {
      const response = await fetch(url, { headers: { accept: 'application/json' } })
      if (response.ok) {
        const json = (await response.json()) as {
          parcels?: { features?: Array<{ geometry?: any; properties?: { fields?: Record<string, unknown> } }> }
        }
        const feature = json.parcels?.features?.[0]
        if (feature) {
          const fields = feature.properties?.fields ?? {}
          const lat = pickNumber(fields, ['lat', 'latitude'])
          const lng = pickNumber(fields, ['lon', 'lng', 'longitude'])
          const geometry = feature.geometry || (lat && lng ? buildSyntheticParcelGeometry(lng, lat) : undefined)

          const sqftStructure = pickNumber(fields, ['sqft', 'bldg_sqft', 'struct_sqft', 'building_sqft']) || 3800
          const sqftLot = pickNumber(fields, ['gis_sqft', 'lot_sqft', 'parcel_sqft']) || 7200
          const rawDelinquent = pickNumber(fields, ['delinquent_tax', 'tax_delinquent_amount']) || 0
          const rawLienStatus = rawDelinquent > 5000 ? 'Eligible for In-Rem Foreclosure' : rawDelinquent > 0 ? 'Notice of Delinquency' : 'Clean / Current'
          const zCode = pick(fields, ['zoning', 'zoning_code']) || 'C-2'
          const zDesc = pick(fields, ['zoning_description', 'zoning_desc']) || 'General Commercial / Mixed-Use'

          const result: ParcelResult = {
            found: true,
            address: pick(fields, ['address', 'saddress', 'situs_address', 'mail_address']) || queryStr,
            ownerName: pick(fields, ['owner', 'owner_name', 'mailadd_owner']) || 'Private Owner',
            zoning: `${zCode} - ${zDesc}`,
            parcelId: pick(fields, ['parcelnumb', 'parcel_id', 'parcelnumb_no_formatting', 'alt_parcelnumb1']) || parcelId || '',
            assessedValue: pick(fields, ['parval', 'total_value', 'landval', 'improvval']) || '$240,000',
            lat,
            lng,
            geometry,
            source: 'regrid',
            sqft_structure: sqftStructure,
            sqft_lot: sqftLot,
            tax_lien_status: rawLienStatus,
            delinquent_tax_amount: rawDelinquent,
            zoning_code: zCode,
            zoning_description: zDesc,
            appraisal_history: [
              { year: 2025, assessedValue: 240000, landValue: 60000, improvementValue: 180000, event: 'Tax Assessment' },
              { year: 2023, assessedValue: 215000, landValue: 55000, improvementValue: 160000, event: 'Tax Assessment' },
              { year: 2020, assessedValue: 180000, landValue: 45000, improvementValue: 135000, event: 'Comp Sale' },
            ],
          }
          return NextResponse.json(result)
        }
      }
    } catch {
      // Fall through to seed/synthetic fallback
    }
  }

  // Fallback lookup using seeded sites or Milwaukee defaults
  const normalizedKey = queryStr.toLowerCase().replace(/,/g, '').trim()
  const seedMatchKey = Object.keys(SEED_SITE_COORDS).find((k) => normalizedKey.includes(k))
  const seedMatch = seedMatchKey ? SEED_SITE_COORDS[seedMatchKey] : null

  const lat = seedMatch ? seedMatch.lat : 43.0396
  const lng = seedMatch ? seedMatch.lng : -87.945

  const sqftStructure = seedMatch?.sqft_structure || 5200
  const sqftLot = seedMatch?.sqft_lot || 9500
  const zCode = seedMatch?.zoning_code || 'RT4'
  const zDesc = seedMatch?.zoning_description || 'Two-Family & Community Cultural District'

  const fallbackResult: ParcelResult = {
    found: true,
    address: queryStr,
    ownerName: seedMatch ? seedMatch.ownerName : 'City of Milwaukee / Public Owner',
    zoning: seedMatch ? seedMatch.zoning : 'RT4 - Two-Family Residential',
    parcelId: seedMatch ? seedMatch.parcelId : parcelId || '388-1204-000',
    assessedValue: seedMatch ? seedMatch.assessedValue : '$185,000',
    lat,
    lng,
    geometry: buildSyntheticParcelGeometry(lng, lat),
    source: 'seed',
    sqft_structure: sqftStructure,
    sqft_lot: sqftLot,
    tax_lien_status: 'Clean / Current',
    delinquent_tax_amount: 0,
    zoning_code: zCode,
    zoning_description: zDesc,
    appraisal_history: [
      { year: 2025, assessedValue: 185000, landValue: 40000, improvementValue: 145000, event: 'Tax Assessment' },
      { year: 2023, assessedValue: 165000, landValue: 35000, improvementValue: 130000, event: 'Tax Assessment' },
      { year: 2019, assessedValue: 140000, landValue: 30000, improvementValue: 110000, event: 'Municipal Valuation' },
    ],
  }

  return NextResponse.json(fallbackResult)
}

