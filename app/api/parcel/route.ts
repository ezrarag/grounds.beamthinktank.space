import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export interface ParcelResult {
  found: boolean
  address: string
  ownerName: string
  zoning: string
  parcelId: string
  assessedValue: string
  lat?: number
  lng?: number
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

// Regrid nationwide parcel lookup by address. Requires REGRID_API_TOKEN.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')?.trim()
  if (!address) {
    return NextResponse.json({ error: 'An address is required.' }, { status: 400 })
  }

  const token = process.env.REGRID_API_TOKEN
  if (!token) {
    return NextResponse.json(
      { error: 'Parcel lookup is not configured. Set REGRID_API_TOKEN to enable it.' },
      { status: 422 },
    )
  }

  const url = `https://app.regrid.com/api/v2/parcels/address?query=${encodeURIComponent(address)}&limit=1&token=${token}`

  try {
    const response = await fetch(url, { headers: { accept: 'application/json' } })
    if (!response.ok) {
      return NextResponse.json({ error: `Regrid request failed (${response.status})` }, { status: 502 })
    }

    const json = (await response.json()) as {
      parcels?: { features?: Array<{ properties?: { fields?: Record<string, unknown> } }> }
    }
    const feature = json.parcels?.features?.[0]
    const fields = feature?.properties?.fields ?? {}

    const result: ParcelResult = {
      found: Boolean(feature),
      address: pick(fields, ['address', 'saddress', 'situs_address', 'mail_address']),
      ownerName: pick(fields, ['owner', 'owner_name', 'mailadd_owner']),
      zoning: pick(fields, ['zoning', 'zoning_description', 'zoning_code']),
      parcelId: pick(fields, ['parcelnumb', 'parcel_id', 'parcelnumb_no_formatting', 'alt_parcelnumb1']),
      assessedValue: pick(fields, ['parval', 'total_value', 'landval', 'improvval']),
      lat: pickNumber(fields, ['lat', 'latitude']),
      lng: pickNumber(fields, ['lon', 'lng', 'longitude']),
    }

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Parcel lookup failed.' },
      { status: 502 },
    )
  }
}
