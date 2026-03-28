'use client'

import { useEffect } from 'react'
import { auth } from '@/lib/firebase'

export function AuthBootstrapper() {
  useEffect(() => {
    void auth?.authStateReady?.()
  }, [])

  return null
}
