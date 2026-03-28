const DASHBOARD_ROLE_TOKENS = new Set(['admin', 'director', 'lead', 'manager', 'operator', 'staff'])
const PROPERTY_ROLE_TOKENS = new Set(['acquisition', 'business', 'developer', 'finance', 'financing', 'investor', 'partner'])

function tokenizeRole(role: string) {
  return role
    .trim()
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
}

export function resolvePortalPath(role: string | null | undefined) {
  if (!role) return '/portal/cohort'

  const tokens = tokenizeRole(role)

  if (tokens.some((token) => DASHBOARD_ROLE_TOKENS.has(token))) {
    return '/portal/dashboard'
  }

  if (tokens.some((token) => PROPERTY_ROLE_TOKENS.has(token))) {
    return '/portal/properties'
  }

  return '/portal/cohort'
}
