export type LaborType =
  | 'volunteer'
  | 'licensed'
  | 'faculty-supervised'
  | 'research'
  | 'planning'
  | 'production'

export type ProjectStatus = 'feasibility' | 'phase-1' | 'active' | 'paused' | 'complete'
export type PhaseStatus = 'not-started' | 'in-progress' | 'complete'

export interface LaborTypeConfig {
  label: string
  colorBg: string
  colorFg: string
  ledgerEligible: boolean
}

export interface RedevelopmentProject {
  slug: string
  name: string
  address: string
  assetId: string | null
  status: ProjectStatus
  summary: string
  visionBody: string
  restorationRenderUrl: string | null
  heroImageUrl: string | null
  committedCount: number
  totalLoggedHours: number
  financingNote: string
  isPublished: boolean
  sortOrder: number
  updatedAt: string | null
}

export interface PhaseTask {
  title: string
  laborType: LaborType
  estimatedHours: number
  status: PhaseStatus
  note: string | null
}

export interface Phase {
  id: string
  title: string
  order: number
  status: PhaseStatus
  tasks: PhaseTask[]
}

export interface EquitySlot {
  id: string
  role: string
  laborType: LaborType
  hoursNeeded: number
  hoursCommitted: number
  requiresSupervision: boolean
  isOpen: boolean
  sortOrder: number
}

export interface RedevelopmentProjectBundle {
  project: RedevelopmentProject
  phases: Phase[]
  equitySlots: EquitySlot[]
}

export const laborTypes: Record<LaborType, LaborTypeConfig> = {
  volunteer: {
    label: 'Volunteer sweat-equity',
    colorBg: '#EAF3DE',
    colorFg: '#3B6D11',
    ledgerEligible: true,
  },
  licensed: {
    label: 'Licensed + permitted',
    colorBg: '#FBE9E7',
    colorFg: '#A23C28',
    ledgerEligible: false,
  },
  'faculty-supervised': {
    label: 'Faculty-supervised',
    colorBg: '#E7EEFB',
    colorFg: '#2A4C8F',
    ledgerEligible: true,
  },
  research: {
    label: 'Research',
    colorBg: '#FAEEDA',
    colorFg: '#854F0B',
    ledgerEligible: true,
  },
  planning: {
    label: 'Planning',
    colorBg: '#EEEDFE',
    colorFg: '#3C3489',
    ledgerEligible: true,
  },
  production: {
    label: 'Production',
    colorBg: '#E1F5EE',
    colorFg: '#0F6E56',
    ledgerEligible: true,
  },
}

