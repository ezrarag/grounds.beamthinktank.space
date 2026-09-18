import { NextResponse } from 'next/server'
import { getCivicRepresentatives, getNonProfitPartners } from '@/lib/civicPartners'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const cityId = searchParams.get('cityId') || undefined

  const reps = getCivicRepresentatives(cityId)
  const partners = getNonProfitPartners(cityId)

  return NextResponse.json({
    cityId: cityId || 'all',
    representatives: reps,
    nonProfitPartners: partners,
    count: reps.length + partners.length,
  })
}

export async function POST(request: Request) {
  const body = ((await request.json().catch(() => null)) ?? {}) as { cityId?: string }
  const cityId = body.cityId || undefined

  const reps = getCivicRepresentatives(cityId)
  const partners = getNonProfitPartners(cityId)

  return NextResponse.json({
    cityId: cityId || 'all',
    representatives: reps,
    nonProfitPartners: partners,
    count: reps.length + partners.length,
  })
}
