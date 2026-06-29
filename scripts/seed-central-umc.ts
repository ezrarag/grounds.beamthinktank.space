import { createPrivateKey, sign as signJwt } from 'node:crypto'

type LaborType = 'volunteer' | 'licensed' | 'faculty-supervised' | 'research' | 'planning' | 'production'
type PhaseStatus = 'not-started' | 'in-progress' | 'complete'
type ProjectStatus = 'feasibility' | 'phase-1' | 'active' | 'paused' | 'complete'

interface ServiceAccount {
  client_email: string
  private_key: string
  project_id?: string
}

interface FirestoreValue {
  stringValue?: string
  integerValue?: string
  doubleValue?: number
  booleanValue?: boolean
  nullValue?: null
  timestampValue?: string
  mapValue?: {
    fields: Record<string, FirestoreValue>
  }
  arrayValue?: {
    values: FirestoreValue[]
  }
}

function getEnv(name: string) {
  const value = process.env[name]
  return value && value !== 'undefined' ? value : null
}

function parseServiceAccount(): ServiceAccount {
  const raw = getEnv('FIREBASE_SERVICE_ACCOUNT_JSON') ?? getEnv('GOOGLE_SERVICE_ACCOUNT_JSON')

  if (!raw) {
    throw new Error('Set FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_SERVICE_ACCOUNT_JSON before running this seed.')
  }

  const parsed = JSON.parse(raw) as ServiceAccount

  if (!parsed.client_email || !parsed.private_key) {
    throw new Error('Service account JSON must include client_email and private_key.')
  }

  return parsed
}

function base64UrlEncode(input: string | Buffer) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

async function getAccessToken(serviceAccount: ServiceAccount) {
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }

  const unsignedToken = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(payload))}`
  const signature = signJwt('RSA-SHA256', Buffer.from(unsignedToken), createPrivateKey(serviceAccount.private_key))
  const assertion = `${unsignedToken}.${base64UrlEncode(signature)}`

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to exchange JWT for access token: ${response.status} ${await response.text()}`)
  }

  const payloadJson = (await response.json()) as { access_token: string }
  return payloadJson.access_token
}

function toFirestoreValue(value: unknown): FirestoreValue {
  if (value === null) return { nullValue: null }
  if (typeof value === 'string') return { stringValue: value }
  if (typeof value === 'boolean') return { booleanValue: value }

  if (typeof value === 'number') {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value }
  }

  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map((item) => toFirestoreValue(item)),
      },
    }
  }

  if (typeof value === 'object') {
    return {
      mapValue: {
        fields: Object.fromEntries(
          Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, toFirestoreValue(item)]),
        ),
      },
    }
  }

  throw new Error(`Unsupported Firestore value: ${String(value)}`)
}

function toFirestoreDocument(record: Record<string, unknown>) {
  return {
    fields: Object.fromEntries(Object.entries(record).map(([key, value]) => [key, toFirestoreValue(value)])),
  }
}

async function patchDocument(
  accessToken: string,
  projectId: string,
  path: string,
  record: Record<string, unknown>,
  updateMask?: string[],
) {
  const url = new URL(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${path}`)

  for (const field of updateMask ?? Object.keys(record)) {
    url.searchParams.append('updateMask.fieldPaths', field)
  }

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(toFirestoreDocument(record)),
  })

  if (!response.ok) {
    throw new Error(`Failed to write ${path}: ${response.status} ${await response.text()}`)
  }
}

function phaseTask(
  title: string,
  laborType: LaborType,
  estimatedHours: number,
  status: PhaseStatus,
  note: string | null = null,
) {
  return {
    title,
    laborType,
    estimatedHours,
    status,
    note,
  }
}

async function main() {
  const serviceAccount = parseServiceAccount()
  const projectId = getEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID') ?? serviceAccount.project_id

  if (!projectId) {
    throw new Error('NEXT_PUBLIC_FIREBASE_PROJECT_ID or service-account project_id is required.')
  }

  const accessToken = await getAccessToken(serviceAccount)
  const slug = 'central-umc'
  const project: Record<string, unknown> = {
    slug,
    name: 'Central United Methodist Church - Redevelopment Pilot',
    address: 'Milwaukee, WI',
    assetId: null,
    status: 'phase-1' satisfies ProjectStatus,
    summary:
      'A church building brought back into full community use - civic anchor on the ground floor, a dual recording-and-rehearsal space in the old choir room, and a roof restored by a cohort of community members who earn equity through the work.',
    visionBody:
      "Central UMC is BEAM's first sweat-equity redevelopment pilot.\n\nCommunity members do the work they can legally do - cleanup, prep, documentation - logged as verified contribution. Licensed trades and permits handle the roof structure, funded by the grants and credits that the documented sweat-equity unlocks.\n\nThe restored building hosts fundraising concerts that carry the project forward.",
    financingNote:
      'Hours are recorded in the BEAM ledger as documented contribution - never as loans. Those verified contributions are the match that unlocks SHOP/HOME grants, historic tax credits, and bond/CDFI capital, which pays for the licensed roof work. The ledger is the record, not the lender.',
    restorationRenderUrl: null,
    heroImageUrl: null,
    committedCount: 5,
    totalLoggedHours: 0,
    isPublished: true,
    sortOrder: 1,
    updatedAt: new Date().toISOString(),
  }

  const phases = [
    {
      id: 'phase-1-stabilize-document',
      record: {
        title: 'Phase 1 - Stabilize & Document',
        order: 1,
        status: 'in-progress' satisfies PhaseStatus,
        tasks: [
          phaseTask(
            'Feasibility & condition assessment',
            'faculty-supervised',
            16,
            'in-progress',
            'Laser scan + structural condition report with Krissie Meingast & William Krueger (UWM Architecture).',
          ),
          phaseTask('Historic-designation & title check', 'research', 8, 'not-started', 'Register status (tax credits + design review) and title.'),
          phaseTask('Interior cleanout', 'volunteer', 40, 'in-progress'),
          phaseTask('Choir-room clearing', 'volunteer', 16, 'not-started', 'Prep for the dual recording + rehearsal conversion.'),
          phaseTask(
            'Roof surface clearing - trees, debris, grass',
            'volunteer',
            32,
            'not-started',
            'Surface clearing only; structural repair is a separate licensed task below.',
          ),
          phaseTask(
            'Structural roof repair',
            'licensed',
            0,
            'not-started',
            'Licensed roofing contractor + pulled permit. Funded by what the sweat-equity unlocks. NOT volunteer work.',
          ),
          phaseTask(
            'Historic roofline research',
            'research',
            12,
            'not-started',
            'Original photos for the restoration render + historic-credit app.',
          ),
          phaseTask('Restoration render', 'production', 6, 'not-started'),
        ],
      },
    },
  ]

  const equitySlots = [
    {
      id: 'slot-interior-cleanout',
      record: {
        role: 'Interior cleanout crew',
        laborType: 'volunteer' satisfies LaborType,
        hoursNeeded: 40,
        hoursCommitted: 14,
        requiresSupervision: false,
        isOpen: true,
        sortOrder: 1,
      },
    },
    {
      id: 'slot-choir-room',
      record: {
        role: 'Choir-room clearing team',
        laborType: 'volunteer' satisfies LaborType,
        hoursNeeded: 16,
        hoursCommitted: 6,
        requiresSupervision: false,
        isOpen: true,
        sortOrder: 2,
      },
    },
    {
      id: 'slot-roof-surface',
      record: {
        role: 'Roof surface clearing cohort',
        laborType: 'volunteer' satisfies LaborType,
        hoursNeeded: 32,
        hoursCommitted: 9,
        requiresSupervision: true,
        isOpen: true,
        sortOrder: 3,
      },
    },
    {
      id: 'slot-photo-research',
      record: {
        role: 'Historic photo research',
        laborType: 'research' satisfies LaborType,
        hoursNeeded: 12,
        hoursCommitted: 4,
        requiresSupervision: false,
        isOpen: true,
        sortOrder: 4,
      },
    },
    {
      id: 'slot-render-production',
      record: {
        role: 'Restoration render production',
        laborType: 'production' satisfies LaborType,
        hoursNeeded: 6,
        hoursCommitted: 2,
        requiresSupervision: true,
        isOpen: true,
        sortOrder: 5,
      },
    },
  ]

  await patchDocument(accessToken, projectId, `redevelopmentProjects/${slug}`, project)

  for (const phase of phases) {
    await patchDocument(accessToken, projectId, `redevelopmentProjects/${slug}/phases/${phase.id}`, phase.record)
  }

  for (const slot of equitySlots) {
    await patchDocument(accessToken, projectId, `redevelopmentProjects/${slug}/equitySlots/${slot.id}`, slot.record)
  }

  console.log(`Seeded redevelopmentProjects/${slug}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
