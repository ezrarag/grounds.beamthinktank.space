import { NextResponse } from 'next/server'
import { isAdminEmail } from '@/lib/adminAccess'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const uid = searchParams.get('uid')

  if (!uid) {
    return NextResponse.json({ error: 'Missing uid parameter' }, { status: 400 })
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY

  if (!projectId || !apiKey) {
    return NextResponse.json({ error: 'Firebase project configuration missing' }, { status: 500 })
  }

  try {
    const response = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/userRoles/${uid}?key=${apiKey}`,
      { cache: 'no-store' }
    )

    if (response.status === 404) {
      return NextResponse.json({
        grant: {
          uid,
          role: 'community-member',
          subtype: null,
          grantedBy: 'system-default',
          grantedAt: new Date().toISOString(),
        },
      })
    }

    if (!response.ok) {
      return NextResponse.json({ error: `Firestore fetch error: ${response.status}` }, { status: response.status })
    }

    const doc = await response.json()
    const fields = doc.fields || {}

    return NextResponse.json({
      grant: {
        uid: fields.uid?.stringValue || uid,
        email: fields.email?.stringValue || '',
        role: fields.role?.stringValue || 'community-member',
        subtype: fields.subtype?.stringValue || null,
        grantedBy: fields.grantedBy?.stringValue || 'admin',
        grantedAt: fields.grantedAt?.stringValue || new Date().toISOString(),
      },
    })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { adminEmail, uid, email, role, subtype } = body

    // 1. Verify caller authorization (must be admin)
    if (!adminEmail || !isAdminEmail(adminEmail)) {
      return NextResponse.json({ error: 'Unauthorized: Only admins can issue role grants' }, { status: 403 })
    }

    if (!uid || !role) {
      return NextResponse.json({ error: 'Missing required fields (uid, role)' }, { status: 400 })
    }

    const validRoles = ['community-member', 'verified-professional', 'cohort-manager', 'admin']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: `Invalid role: ${role}` }, { status: 400 })
    }

    const validSubtypes = ['general-contractor', 'underwriter', 'attorney', 'surveyor', 'architect']
    if (role === 'verified-professional' && subtype && !validSubtypes.includes(subtype)) {
      return NextResponse.json({ error: `Invalid subtype: ${subtype}` }, { status: 400 })
    }

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY

    if (!projectId || !apiKey) {
      return NextResponse.json({ error: 'Firebase project configuration missing' }, { status: 500 })
    }

    const grantedAt = new Date().toISOString()

    const fields: Record<string, { stringValue: string }> = {
      uid: { stringValue: uid },
      email: { stringValue: email || '' },
      role: { stringValue: role },
      grantedBy: { stringValue: adminEmail },
      grantedAt: { stringValue: grantedAt },
    }

    if (subtype) {
      fields.subtype = { stringValue: subtype }
    }

    const patchUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/userRoles/${uid}?key=${apiKey}`

    const firestoreRes = await fetch(patchUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    })

    if (!firestoreRes.ok) {
      const errText = await firestoreRes.text()
      return NextResponse.json({ error: `Firestore write error: ${errText}` }, { status: firestoreRes.status })
    }

    return NextResponse.json({
      success: true,
      grant: {
        uid,
        email: email || '',
        role,
        subtype: subtype || null,
        grantedBy: adminEmail,
        grantedAt,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal Server Error' }, { status: 500 })
  }
}
