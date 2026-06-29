import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

// Proxies a Google Street View Static image for an address so the API key stays
// server-side. Stored as a property's heroImageUrl like /api/streetview?location=...
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const location = searchParams.get('location')?.trim()
  if (!location) {
    return NextResponse.json({ error: 'A location is required.' }, { status: 400 })
  }

  const key = process.env.GOOGLE_MAPS_SERVER_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!key) {
    return NextResponse.json({ error: 'Google Maps key is not configured.' }, { status: 422 })
  }

  const size = searchParams.get('size') ?? '640x400'
  const url = `https://maps.googleapis.com/maps/api/streetview?size=${encodeURIComponent(size)}&location=${encodeURIComponent(location)}&key=${key}`

  try {
    const response = await fetch(url)
    if (!response.ok) {
      return NextResponse.json({ error: `Street View request failed (${response.status})` }, { status: 502 })
    }
    const buffer = await response.arrayBuffer()
    return new Response(buffer, {
      headers: {
        'content-type': response.headers.get('content-type') ?? 'image/jpeg',
        'cache-control': 'public, max-age=86400',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Street View request failed.' },
      { status: 502 },
    )
  }
}
