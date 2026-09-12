'use client'

import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { ProgramArea } from '@/lib/types/programArea'

export function useProgramAreas(assetId?: string): {
  programAreas: ProgramArea[]
  loading: boolean
  error: string | null
} {
  const [programAreas, setProgramAreas] = useState<ProgramArea[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!assetId) {
      setProgramAreas([])
      setLoading(false)
      return
    }

    if (!db) {
      setLoading(false)
      setError('Firebase is not configured.')
      return
    }

    const q = query(collection(db, 'programAreas'), where('assetId', '==', assetId))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setProgramAreas(
          snapshot.docs.map((doc) => ({
            ...(doc.data() as Omit<ProgramArea, 'id'>),
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

  return { programAreas, loading, error }
}
