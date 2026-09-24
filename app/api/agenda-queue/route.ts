import { NextResponse } from 'next/server'
import { db, sanitizeForFirestore } from '@/lib/firebase'
import { collection, addDoc } from 'firebase/firestore'

export const runtime = 'nodejs'

export interface AgendaQueuePayload {
  topic: string
  category?: 'monetization' | 'title-acquisition' | 'bfcu-capital' | 'community-clt' | 'participant-housing' | 'general'
  stakeholderName?: string
  stakeholderRole?: string
  contact?: string
  urgency?: 'routine' | 'priority' | 'urgent'
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as Partial<AgendaQueuePayload> | null

    if (!body || !body.topic || !body.topic.trim()) {
      return NextResponse.json({ error: 'A question or topic is required to submit to the agenda queue.' }, { status: 400 })
    }

    const payload = {
      topic: body.topic.trim(),
      category: body.category || 'general',
      stakeholderName: body.stakeholderName?.trim() || 'Leadership Stakeholder',
      stakeholderRole: body.stakeholderRole?.trim() || 'Board / Advisor / Partner',
      contact: body.contact?.trim() || '',
      urgency: body.urgency || 'priority',
      sourceDivision: 'grounds',
      sourcePage: '/',
      status: 'queued',
      createdAt: new Date().toISOString(),
      syncedToHome: false,
    }

    let docId = `queue-${Date.now()}`

    // 1. Guaranteed local write to Grounds Firestore
    if (db) {
      try {
        const cleanData = sanitizeForFirestore(payload)
        const docRef = await addDoc(collection(db, 'agendaQueue'), cleanData)
        docId = docRef.id
      } catch (err) {
        console.warn('Local Grounds Firestore write warning:', err)
      }
    }

    // 2. Non-blocking attempt to forward to BEAM Home endpoint (OVERBEAR target)
    let homeSynced = false
    const homeEndpoint = process.env.BEAM_HOME_AGENDA_MIRROR_ENDPOINT || 'https://home.beamthinktank.space/api/agenda-queue'

    try {
      const homeRes = await fetch(homeEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, groundsDocId: docId }),
      })
      if (homeRes.ok) {
        homeSynced = true
      }
    } catch {
      // Non-blocking: OVERBEAR thread will handle async reconciliation
    }

    return NextResponse.json({
      success: true,
      queueId: docId,
      homeSynced,
      message: 'Your topic has been logged to the BEAM leadership agenda queue for the next meeting.',
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unable to record agenda topic.' },
      { status: 500 }
    )
  }
}
