'use client'

import { usePathname } from 'next/navigation'
import { buildHandoffUrl, type HandoffRole } from '@/lib/beam-home'
import { usePortalAccessState } from '@/components/PortalAccessProvider'
import type { NGOConfig } from '@/lib/ngoConfig'
import { resolvePortalPath } from '@/lib/resolvePortalPath'

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

/**
 * Derives per-config routing/handoff values from the shared portal access state.
 * The membership snapshot itself is owned by {@link PortalAccessProvider}; this
 * hook adds no fetch of its own.
 */
export function usePortalAccess(config: NGOConfig) {
  const pathname = usePathname()
  const state = usePortalAccessState()
  const returnPath = pathname || config.handoffReturnPath

  return {
    ...state,
    currentPath: returnPath,
    targetPath: resolvePortalPath({ pathwayRole: state.pathwayRole, role: state.role }),
    signInUrl: buildHandoffUrl(config, {
      role: resolveHandoffRole(state.role),
      returnPath,
    }),
  }
}
