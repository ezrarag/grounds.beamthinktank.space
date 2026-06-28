'use client'

import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { isAdminEmail } from '@/lib/adminAccess'

/**
 * Client-side admin check based on the signed-in Google account's email.
 * Used to gate admin-only UI; Firestore rules enforce the real boundary.
 */
export function useIsAdmin(): { isAdmin: boolean; ready: boolean; email: string | null } {
  const [isAdmin, setIsAdmin] = useState(false)
  const [email, setEmail] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!auth) {
      setReady(true)
      return
    }

    return onAuthStateChanged(
      auth,
      (user) => {
        setEmail(user?.email ?? null)
        setIsAdmin(isAdminEmail(user?.email))
        setReady(true)
      },
      () => {
        setEmail(null)
        setIsAdmin(false)
        setReady(true)
      },
    )
  }, [])

  return { isAdmin, ready, email }
}
