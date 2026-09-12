'use client'

import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Unit } from '@/lib/types/unit'

export function useUnits(assetId?: string): {
  units: Unit[]
  loading: boolean
  error: string | null
} {
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!assetId) {
      setUnits([])
      setLoading(false)
      return
    }

    if (!db) {
      setLoading(false)
      setError('Firebase is not configured.')
      return
    }

    const q = query(collection(db, 'units'), where('assetId', '==', assetId))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setUnits(
          snapshot.docs.map((doc) => ({
            ...(doc.data() as Omit<Unit, 'id'>),
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
  }, [assetId])

  return { units, loading, error }
}
