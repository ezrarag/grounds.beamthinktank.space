import type { NGOConfig } from '@/lib/ngoConfig'

export type HandoffRole = 'student' | 'business' | 'community'

export interface BuildHandoffUrlOptions {
  role?: HandoffRole
  returnPath?: string
  redirectTarget?: string
}

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0'])

function normalizeBaseUrl(url: string) {
  return url.replace(/\/+$/, '')
}

function readPublicSiteUrl(config: NGOConfig) {
  if (!config.siteUrl.trim()) return null

  try {
    const parsed = new URL(config.siteUrl)
    if (LOCAL_HOSTNAMES.has(parsed.hostname)) return null
    return normalizeBaseUrl(parsed.toString())
  } catch {
    return null
  }
}

function buildReturnUrl(siteUrl: string | null, returnPath: string) {
  if (!siteUrl) return null
  return new URL(returnPath, `${siteUrl}/`).toString()
}

export function buildHandoffUrl(config: NGOConfig, options: BuildHandoffUrlOptions = {}) {
  const endpoint = new URL('/onboard/handoff', `${normalizeBaseUrl(config.beamHomeUrl)}/`)
  const siteUrl = readPublicSiteUrl(config)
  const returnPath = options.returnPath ?? config.handoffReturnPath
  const returnUrl = buildReturnUrl(siteUrl, returnPath)

  endpoint.searchParams.set('role', options.role ?? 'community')
  endpoint.searchParams.set('sourceType', 'ngo_site')
  endpoint.searchParams.set('sourceSystem', 'beam')
  endpoint.searchParams.set('entryChannel', config.entryChannel)
  endpoint.searchParams.set('organizationId', config.organizationId)
  endpoint.searchParams.set('organizationName', config.name)
  endpoint.searchParams.set('cohortId', config.cohortId)
  endpoint.searchParams.set('scenarioLabel', config.name)
  endpoint.searchParams.set('redirectTarget', options.redirectTarget ?? 'dashboard')

  if (siteUrl) {
    endpoint.searchParams.set('siteUrl', siteUrl)
    endpoint.searchParams.set('referrerUrl', siteUrl)
  }

  if (returnUrl) {
    endpoint.searchParams.set('landingPageUrl', returnUrl)
    endpoint.searchParams.set('returnTo', returnUrl)
  }

  return endpoint.toString()
}
