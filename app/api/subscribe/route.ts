import { NextResponse } from 'next/server'

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as { email?: unknown; source?: unknown } | null
  const email = typeof payload?.email === 'string' ? payload.email.trim() : ''

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 })
  }

  return NextResponse.json({
    message: 'Subscription captured for BEAM Grounds public updates.',
    source: typeof payload?.source === 'string' ? payload.source : 'unknown',
  })
}
