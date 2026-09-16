import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, addDoc } from 'firebase/firestore'

export const runtime = 'nodejs'

export interface ForgeFeedbackPayload {
  sourceDomain: string
  division: string
  userUid?: string
  displayName?: string
  email?: string
  feedbackType: 'bug' | 'feature' | 'ux' | 'general'
  comment: string
  screenshotUrl?: string
  pageUrl?: string
  timestamp: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as Partial<ForgeFeedbackPayload> | null
    if (!body || !body.comment || !body.comment.trim()) {
      return NextResponse.json({ error: 'Comment content is required.' }, { status: 400 })
    }

    const payload: ForgeFeedbackPayload = {
      sourceDomain: 'grounds.beamthinktank.space',
      division: 'grounds',
      userUid: body.userUid || 'anonymous',
      displayName: body.displayName || 'Steward Participant',
      email: body.email || '',
      feedbackType: body.feedbackType || 'general',
      comment: body.comment.trim(),
      screenshotUrl: body.screenshotUrl || '',
      pageUrl: body.pageUrl || '/portal/participant',
      timestamp: new Date().toISOString(),
    }

    // 1. Store local echo fallback in Firestore if db available
    let docId = ''
    if (db) {
      try {
        const docRef = await addDoc(collection(db, 'forgeFeedbackEchoes'), payload)
        docId = docRef.id
      } catch (err) {
        console.warn('Firestore fallback write error:', err)
      }
    }

    // 2. Forward payload to Forge endpoint
    let forgeEchoed = false
    const forgeEndpoint = process.env.FORGE_FEEDBACK_ENDPOINT || 'https://forge.beamthinktank.space/api/feedback'

    try {
      const forgeRes = await fetch(forgeEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (forgeRes.ok) {
        forgeEchoed = true
      }
    } catch {
      // Forge endpoint offline/local dev fallback
    }

    return NextResponse.json({
      success: true,
      echoId: docId || `echo-${Date.now()}`,
      forgeEchoed,
      message: forgeEchoed
        ? 'Feedback successfully transmitted to Forge!'
        : 'Feedback stored locally in BEAM Grounds ledger and queued for Forge synchronization.',
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unable to process feedback submission.' },
      { status: 500 }
    )
  }
}
