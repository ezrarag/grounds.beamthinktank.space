'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { type User } from 'firebase/auth'
import { buildHandoffUrl, type HandoffRole } from '@/lib/beam-home'
import { subscribeToAuth } from '@/lib/firebase'
import type { NGOConfig } from '@/lib/ngoConfig'
import { resolvePortalPath } from '@/lib/resolvePortalPath'

interface PortalAccessState {
  status: 'loading' | 'signed-out' | 'authenticated'
  user: User | null
  role: string
}

function resolveHandoffRole(role: string): HandoffRole {
  const normalized = role.trim().toLowerCase()

  if (['acquisition', 'business', 'developer', 'finance', 'financing', 'investor', 'partner'].some((token) => normalized.includes(token))) {
    return 'business'
  }

  if (normalized.includes('student')) {
    return 'student'
  }

  return 'community'
}

async function readUserRole(user: User) {
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

export function usePortalAccess(config: NGOConfig) {
  const pathname = usePathname()
  const [state, setState] = useState<PortalAccessState>({
    status: 'loading',
    user: null,
    role: 'community',
  })

  useEffect(() => {
    let isCancelled = false
    const loadingFallback = window.setTimeout(() => {
      if (isCancelled) return

      setState((current) => {
        if (current.status !== 'loading') return current

        return {
          status: 'signed-out',
          user: null,
          role: 'community',
        }
      })
    }, 3000)

    const unsubscribe = subscribeToAuth((user) => {
      window.clearTimeout(loadingFallback)

      if (!user) {
        if (!isCancelled) {
          setState({
            status: 'signed-out',
            user: null,
            role: 'community',
          })
        }
        return
      }

      void readUserRole(user).then((role) => {
        if (isCancelled) return
        setState({
          status: 'authenticated',
          user,
          role,
        })
      })
    })

    return () => {
      isCancelled = true
      window.clearTimeout(loadingFallback)
      unsubscribe()
    }
  }, [])

  const returnPath = pathname || config.handoffReturnPath

  return {
    ...state,
    currentPath: returnPath,
    targetPath: resolvePortalPath(state.role),
    signInUrl: buildHandoffUrl(config, {
      role: resolveHandoffRole(state.role),
      returnPath,
    }),
  }
}
