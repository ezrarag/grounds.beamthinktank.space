import type { PathwayRole } from '@/lib/ngoConfig'
import { PATHWAY_ROUTES } from '@/lib/pathwayDashboards'

/**
 * Routing model: `pathwayRole` (the self-sorted door) is the routing key;
 * legacy `role` is the permission level. Admins land on the acquisition
 * overview and may preview any pathway dashboard from there.
 */
export interface MembershipRouting {
  pathwayRole?: string | null
  role?: string | null
}

/** Permission-level tokens that grant the admin "see everything" view. */
const ADMIN_ROLE_TOKENS = new Set(['admin', 'director', 'manager', 'operator', 'staff', 'lead'])

/** Legacy role tokens mapped onto the new pathway doors. */
const LEGACY_ROLE_TO_PATHWAY: Record<string, PathwayRole> = {
  cohort: 'earn',
  student: 'earn',
  partner: 'partner',
  business: 'partner',
  developer: 'partner',
  finance: 'partner',
  financing: 'partner',
  investor: 'partner',
  acquisition: 'partner',
  member: 'own',
}

const PATHWAY_ROLES: PathwayRole[] = ['learn', 'earn', 'teach', 'partner', 'own']

/** Where authenticated users with no resolvable pathway land (the entry interstitial). */
export const PATHWAY_ONBOARDING_PATH = '/portal/dashboard'

/** Admin overview surface. */
export const ADMIN_OVERVIEW_PATH = '/portal/acquisition'

function tokenizeRole(role: string | null | undefined) {
  return (role ?? '')
    .trim()
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
}

export function normalizePathwayRole(value: unknown): PathwayRole | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim().toLowerCase()
  return (PATHWAY_ROLES as string[]).includes(normalized) ? (normalized as PathwayRole) : null
}

export function isAdminRole(role: string | null | undefined): boolean {
  return tokenizeRole(role).some((token) => ADMIN_ROLE_TOKENS.has(token))
}

/**
 * Resolve the destination workspace for a membership.
 * Accepts the membership doc shape (or a bare legacy role string for back-compat).
 */
export function resolvePortalPath(input: MembershipRouting | string | null | undefined): string {
  const membership: MembershipRouting = typeof input === 'string' ? { role: input } : input ?? {}

  // 1. pathwayRole is the routing key.
  const pathwayRole = normalizePathwayRole(membership.pathwayRole)
  if (pathwayRole) {
    return PATHWAY_ROUTES[pathwayRole]
  }

  // 2. Permission level: admins get the overview surface.
  const tokens = tokenizeRole(membership.role)
  if (tokens.some((token) => ADMIN_ROLE_TOKENS.has(token))) {
    return ADMIN_OVERVIEW_PATH
  }

  // 3. Fall back to mapping a legacy role token onto a pathway door.
  for (const token of tokens) {
    const mapped = LEGACY_ROLE_TO_PATHWAY[token]
    if (mapped) {
      return PATHWAY_ROUTES[mapped]
    }
  }

  // 4. Nothing resolved — send to the "choose your entry point" interstitial.
  return PATHWAY_ONBOARDING_PATH
}
