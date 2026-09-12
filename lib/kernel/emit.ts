'use client'

import { useEffect, useState } from 'react'
import { addDoc, collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { DivisionId, DivisionSignal } from '@/lib/kernel/types'

const KERNEL_SERVICE_URL = process.env.NEXT_PUBLIC_KERNEL_SERVICE_URL || 'https://kernel.beamthinktank.space'
const KERNEL_SITE_TOKEN = process.env.NEXT_PUBLIC_KERNEL_SITE_TOKEN || 'grounds_site_token_dev'

/**
 * Non-blocking signal emission function.
 * Writes to local `pendingSignals` Firestore collection first, returns immediately,
 * and asynchronously dispatches to kernel service. Never throws or blocks asset workflow.
 */
export async function emitSignal(
  signal: Omit<DivisionSignal, 'id' | 'createdAt' | 'updatedAt' | 'status'>,
): Promise<void> {
  const now = new Date().toISOString()
  const payload: Omit<DivisionSignal, 'id'> = {
    ...signal,
    status: 'open',
    createdAt: now,
    updatedAt: now,
  }

  // 1. Write to local Firestore outbox first if available
  if (db) {
    try {
      await addDoc(collection(db, 'pendingSignals'), payload)
    } catch (err) {
      console.warn('Local pendingSignals write warning:', err)
    }
  }

  // 2. Asynchronously POST to kernel service out-of-band (never await blocking)
  void fetch(`${KERNEL_SERVICE_URL}/api/signals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${KERNEL_SITE_TOKEN}`,
    },
    body: JSON.stringify(payload),
  }).catch((err) => {
    console.warn('Async kernel service dispatch warning:', err)
  })
}

/**
 * Hook to subscribe to incoming/pending signals for a target division.
 */
export function useDivisionSignals(division?: DivisionId): {
  signals: DivisionSignal[]
  loading: boolean
  error: string | null
} {
  const [signals, setSignals] = useState<DivisionSignal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!division) {
      setSignals([])
      setLoading(false)
      return
    }

    if (!db) {
      setLoading(false)
      setError('Firebase is not configured.')
      return
    }

    const q = query(collection(db, 'pendingSignals'), where('targetDivision', '==', division))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setSignals(
          snapshot.docs.map((doc) => ({
            ...(doc.data() as Omit<DivisionSignal, 'id'>),
            id: doc.id,
          })),
        )
        setError(null)
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      },
    )

    return unsubscribe
  }, [division])

  return { signals, loading, error }
}
