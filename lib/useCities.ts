'use client'

import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { CITIES, storedCityToConfig, type CityConfig, type StoredCity } from '@/lib/cities'

/**
 * Live city registry: built-in cities merged with admin-managed cities from the
 * Firestore `cities` collection (Firestore wins on id collision). Lets admins
 * add cities from the UI with no code change or redeploy.
 */
export function useCities(): {
  cities: CityConfig[]
  stored: CityConfig[]
  storedIds: Set<string>
  loading: boolean
} {
  const [stored, setStored] = useState<CityConfig[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!db) {
      setLoading(false)
      return
    }

    return onSnapshot(
      collection(db, 'cities'),
      (snapshot) => {
        setStored(snapshot.docs.map((docSnap) => storedCityToConfig(docSnap.id, docSnap.data() as StoredCity)))
        setLoading(false)
      },
      () => setLoading(false),
    )
  }, [])

  const cities = useMemo(() => {
    const map = new Map<string, CityConfig>()
    for (const city of CITIES) map.set(city.id, city)
    for (const city of stored) map.set(city.id, city)
    return Array.from(map.values()).sort(
      (a, b) => a.state.localeCompare(b.state) || a.label.localeCompare(b.label),
    )
  }, [stored])

  const storedIds = useMemo(() => new Set(stored.map((city) => city.id)), [stored])

  return { cities, stored, storedIds, loading }
}
