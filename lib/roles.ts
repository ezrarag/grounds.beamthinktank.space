'use client'

import { useEffect, useState } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { isAdminEmail } from '@/lib/adminAccess'

export type UserRole = 'community-member' | 'verified-professional' | 'cohort-manager' | 'admin'

export type VerifiedSubtype =
  | 'general-contractor'
  | 'underwriter'
  | 'attorney'
  | 'surveyor'
  | 'architect'

export interface UserCredentialGrant {
  uid: string
  email?: string
  role: UserRole
  subtype?: VerifiedSubtype | null
  grantedBy: string
  grantedAt: string
}

export interface UserRoleState {
  role: UserRole
  subtype: VerifiedSubtype | null
  grant: UserCredentialGrant | null
  isAdmin: boolean
  isCohortManager: boolean
  isVerifiedProfessional: (subtype?: VerifiedSubtype) => boolean
  loading: boolean
}

export function useUserRole(): UserRoleState {
  const [role, setRole] = useState<UserRole>('community-member')
  const [subtype, setSubtype] = useState<VerifiedSubtype | null>(null)
  const [grant, setGrant] = useState<UserCredentialGrant | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }

    return onAuthStateChanged(auth, async (user: User | null) => {
      if (!user) {
        setRole('community-member')
        setSubtype(null)
        setGrant(null)
        setLoading(false)
        return
      }

      const isAdmin = isAdminEmail(user.email)

      try {
        if (db) {
          const roleDocRef = doc(db, 'userRoles', user.uid)
          const snapshot = await getDoc(roleDocRef)

          if (snapshot.exists()) {
            const data = snapshot.data() as UserCredentialGrant
            setGrant(data)
            setRole(isAdmin ? 'admin' : data.role || 'community-member')
            setSubtype(data.subtype || null)
            setLoading(false)
            return
          }
        }
      } catch (err) {
        console.warn('Failed to fetch user role doc from Firestore:', err)
      }

      if (isAdmin) {
        setRole('admin')
      } else {
        setRole('community-member')
      }
      setSubtype(null)
      setGrant(null)
      setLoading(false)
    })
  }, [])

  const isAdmin = role === 'admin'
  const isCohortManager = isAdmin || role === 'cohort-manager'

  const isVerifiedProfessional = (targetSubtype?: VerifiedSubtype) => {
    if (isAdmin) return true
    if (role !== 'verified-professional') return false
    if (!targetSubtype) return true
    return subtype === targetSubtype
  }

  return {
    role,
    subtype,
    grant,
    isAdmin,
    isCohortManager,
    isVerifiedProfessional,
    loading,
  }
}
