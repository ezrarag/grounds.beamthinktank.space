'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { type User } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { db, subscribeToAuth } from '@/lib/firebase'
import { isAdminRole, normalizePathwayRole } from '@/lib/resolvePortalPath'
import type { PathwayRole } from '@/lib/ngoConfig'

export interface PortalAccessState {
  status: 'loading' | 'signed-out' | 'authenticated'
  user: User | null
  /** Legacy / permission-level role. */
  role: string
  /** Self-sorted routing door, when set on the membership doc. */
  pathwayRole: PathwayRole | null
  chapter: string | null
  isAdmin: boolean
}

const DEFAULT_STATE: PortalAccessState = {
  status: 'loading',
  user: null,
  role: 'community',
  pathwayRole: null,
  chapter: null,
  isAdmin: false,
}

const PortalAccessContext = createContext<PortalAccessState>(DEFAULT_STATE)

export function usePortalAccessState(): PortalAccessState {
  return useContext(PortalAccessContext)
}

async function readTokenRole(user: User): Promise<string> {
  const tokenResult = await user.getIdTokenResult().catch(() => null)
  const roleClaim = tokenResult?.claims.role ?? tokenResult?.claims.beamRole

  if (typeof roleClaim === 'string' && roleClaim.trim()) {
    return roleClaim.trim()
  }

  const rolesClaim = tokenResult?.claims.roles
  if (Array.isArray(rolesClaim) && typeof rolesClaim[0] === 'string' && rolesClaim[0].trim()) {
    return rolesClaim[0].trim()
  }

  return 'community'
}

/**
 * Single source of portal access state. Subscribes to auth once and, per signed-in
 * user, subscribes once to `memberships/{uid}` — so `pathwayRole`/`chapter`/`role`
 * stay live (editing them in the Firestore console updates the UI in real time) and
 * no consumer adds a second fetch.
 */
export function PortalAccessProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PortalAccessState>(DEFAULT_STATE)

  useEffect(() => {
    let isCancelled = false
    let unsubscribeMembership: () => void = () => undefined

    const loadingFallback = window.setTimeout(() => {
      if (isCancelled) return
      setState((current) => (current.status === 'loading' ? { ...DEFAULT_STATE, status: 'signed-out' } : current))
    }, 3000)

    const unsubscribeAuth = subscribeToAuth((user) => {
      window.clearTimeout(loadingFallback)
      unsubscribeMembership()
      unsubscribeMembership = () => undefined

      if (!user) {
        if (!isCancelled) setState({ ...DEFAULT_STATE, status: 'signed-out' })
        return
      }

      void readTokenRole(user).then((tokenRole) => {
        if (isCancelled) return

        // Seed authenticated state from the token claim immediately.
        setState({
          status: 'authenticated',
          user,
          role: tokenRole,
          pathwayRole: null,
          chapter: null,
          isAdmin: isAdminRole(tokenRole),
        })

        if (!db) return

        // Then keep pathwayRole / chapter / role live from the membership doc.
        unsubscribeMembership = onSnapshot(
          doc(db, 'memberships', user.uid),
          (snapshot) => {
            if (isCancelled) return
            const data = snapshot.data() ?? {}
            const membershipRole =
              typeof data.role === 'string' && data.role.trim() ? data.role.trim() : tokenRole

            setState({
              status: 'authenticated',
              user,
              role: membershipRole,
              pathwayRole: normalizePathwayRole(data.pathwayRole),
              chapter: typeof data.chapter === 'string' && data.chapter.trim() ? data.chapter.trim() : null,
              isAdmin: isAdminRole(membershipRole) || isAdminRole(tokenRole),
            })
          },
          () => undefined,
        )
      })
    })

    return () => {
      isCancelled = true
      window.clearTimeout(loadingFallback)
      unsubscribeAuth()
      unsubscribeMembership()
    }
  }, [])

  return <PortalAccessContext.Provider value={state}>{children}</PortalAccessContext.Provider>
}
