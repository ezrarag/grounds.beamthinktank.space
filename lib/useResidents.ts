'use client'

import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Resident } from '@/lib/types/resident'

export function useResidents(assetId?: string): {
  residents: Resident[]
  loading: boolean
  error: string | null
} {
  const [residents, setResidents] = useState<Resident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!assetId) {
      setResidents([])
      setLoading(false)
      return
    }

    if (!db) {
      setLoading(false)
      setError('Firebase is not configured.')
      return
    }

    const q = query(collection(db, 'residents'), where('assetId', '==', assetId))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setResidents(
          snapshot.docs.map((doc) => ({
            ...(doc.data() as Omit<Resident, 'id'>),
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

  return { residents, loading, error }
}
