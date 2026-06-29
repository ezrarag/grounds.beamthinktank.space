import 'server-only'

import type { EquitySlot, LaborType, Phase, PhaseStatus, ProjectStatus, RedevelopmentProject, RedevelopmentProjectBundle } from '@/lib/laborTypes'

interface FirestoreValue {
  stringValue?: string
  integerValue?: string
  doubleValue?: number
  booleanValue?: boolean
  nullValue?: null
  timestampValue?: string
  mapValue?: {
    fields?: Record<string, FirestoreValue>
  }
  arrayValue?: {
    values?: FirestoreValue[]
  }
}

interface FirestoreDocument {
  name: string
  fields?: Record<string, FirestoreValue>
}

function getEnv(name: string) {
  const value = process.env[name]
  return value && value !== 'undefined' ? value : null
}

function firestoreBaseUrl() {
  const projectId = getEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID')
  const apiKey = getEnv('NEXT_PUBLIC_FIREBASE_API_KEY')

  if (!projectId || !apiKey) {
    return null
  }

  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`
}

function documentIdFromName(name: string) {
  return name.split('/').pop() ?? name
}

function unwrapValue(value: FirestoreValue | undefined): unknown {
  if (!value) return null
  if (value.stringValue !== undefined) return value.stringValue
  if (value.integerValue !== undefined) return Number(value.integerValue)
  if (value.doubleValue !== undefined) return value.doubleValue
  if (value.booleanValue !== undefined) return value.booleanValue
  if (value.timestampValue !== undefined) return value.timestampValue
  if (value.nullValue !== undefined) return null
  if (value.arrayValue) return (value.arrayValue.values ?? []).map((item) => unwrapValue(item))

  if (value.mapValue) {
    return Object.fromEntries(
      Object.entries(value.mapValue.fields ?? {}).map(([key, item]) => [key, unwrapValue(item)]),
    )
  }

  return null
}

function getString(fields: Record<string, FirestoreValue>, key: string) {
  const value = unwrapValue(fields[key])
  return typeof value === 'string' ? value : ''
}

function getNullableString(fields: Record<string, FirestoreValue>, key: string) {
  const value = unwrapValue(fields[key])
  return typeof value === 'string' ? value : null
}

function getNumber(fields: Record<string, FirestoreValue>, key: string) {
  const value = unwrapValue(fields[key])
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function getBoolean(fields: Record<string, FirestoreValue>, key: string) {
  return unwrapValue(fields[key]) === true
}

function getPhaseStatus(value: unknown): PhaseStatus {
  return value === 'in-progress' || value === 'complete' ? value : 'not-started'
}

function getProjectStatus(value: unknown): ProjectStatus {
  return value === 'phase-1' || value === 'active' || value === 'paused' || value === 'complete' ? value : 'feasibility'
}

function getLaborType(value: unknown): LaborType {
  switch (value) {
    case 'licensed':
    case 'faculty-supervised':
    case 'research':
    case 'planning':
    case 'production':
      return value
    default:
      return 'volunteer'
  }
}

async function fetchFirestoreDocument(path: string) {
  const baseUrl = firestoreBaseUrl()
  const apiKey = getEnv('NEXT_PUBLIC_FIREBASE_API_KEY')

  if (!baseUrl || !apiKey) {
    return null
  }

  const response = await fetch(`${baseUrl}/${path}?key=${apiKey}`, {
    cache: 'no-store',
  })

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`Firestore request failed for ${path}: ${response.status}`)
  }

  return (await response.json()) as FirestoreDocument
}

async function fetchFirestoreCollection(path: string) {
  const baseUrl = firestoreBaseUrl()
  const apiKey = getEnv('NEXT_PUBLIC_FIREBASE_API_KEY')

  if (!baseUrl || !apiKey) {
    return []
  }

  const response = await fetch(`${baseUrl}/${path}?key=${apiKey}`, {
    cache: 'no-store',
  })

  if (response.status === 404) {
    return []
  }

  if (!response.ok) {
    throw new Error(`Firestore request failed for ${path}: ${response.status}`)
  }

  const payload = (await response.json()) as { documents?: FirestoreDocument[] }
  return payload.documents ?? []
}

function parseProject(document: FirestoreDocument): RedevelopmentProject {
  const fields = document.fields ?? {}

  return {
    slug: getString(fields, 'slug') || documentIdFromName(document.name),
    name: getString(fields, 'name'),
    address: getString(fields, 'address'),
    assetId: getNullableString(fields, 'assetId'),
    status: getProjectStatus(unwrapValue(fields.status)),
    summary: getString(fields, 'summary'),
    visionBody: getString(fields, 'visionBody'),
    restorationRenderUrl: getNullableString(fields, 'restorationRenderUrl'),
    heroImageUrl: getNullableString(fields, 'heroImageUrl'),
    committedCount: getNumber(fields, 'committedCount'),
    totalLoggedHours: getNumber(fields, 'totalLoggedHours'),
    financingNote: getString(fields, 'financingNote'),
    isPublished: getBoolean(fields, 'isPublished'),
    sortOrder: getNumber(fields, 'sortOrder'),
    updatedAt: getNullableString(fields, 'updatedAt'),
  }
}

function parseTasks(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value.map((task) => {
    const record = typeof task === 'object' && task ? (task as Record<string, unknown>) : {}

    return {
      title: typeof record.title === 'string' ? record.title : 'Untitled task',
      laborType: getLaborType(record.laborType),
      estimatedHours: typeof record.estimatedHours === 'number' ? record.estimatedHours : 0,
      status: getPhaseStatus(record.status),
      note: typeof record.note === 'string' ? record.note : null,
    }
  })
}

function parsePhase(document: FirestoreDocument): Phase {
  const fields = document.fields ?? {}

  return {
    id: documentIdFromName(document.name),
    title: getString(fields, 'title'),
    order: getNumber(fields, 'order'),
    status: getPhaseStatus(unwrapValue(fields.status)),
    tasks: parseTasks(unwrapValue(fields.tasks)),
  }
}

function parseEquitySlot(document: FirestoreDocument): EquitySlot {
  const fields = document.fields ?? {}

  return {
    id: documentIdFromName(document.name),
    role: getString(fields, 'role'),
    laborType: getLaborType(unwrapValue(fields.laborType)),
    hoursNeeded: getNumber(fields, 'hoursNeeded'),
    hoursCommitted: getNumber(fields, 'hoursCommitted'),
    requiresSupervision: getBoolean(fields, 'requiresSupervision'),
    isOpen: getBoolean(fields, 'isOpen'),
    sortOrder: getNumber(fields, 'sortOrder'),
  }
}

export async function getProject(slug: string): Promise<RedevelopmentProjectBundle | null> {
  const document = await fetchFirestoreDocument(`redevelopmentProjects/${slug}`)

  if (!document) {
    return null
  }

  const project = parseProject(document)

  const [phaseDocs, slotDocs] = await Promise.all([
    fetchFirestoreCollection(`redevelopmentProjects/${slug}/phases`),
    fetchFirestoreCollection(`redevelopmentProjects/${slug}/equitySlots`),
  ])

  return {
    project,
    phases: phaseDocs.map(parsePhase).sort((left, right) => left.order - right.order),
    equitySlots: slotDocs.map(parseEquitySlot).sort((left, right) => left.sortOrder - right.sortOrder),
  }
}

