export type DivisionId =
  | 'health'
  | 'law'
  | 'forge'
  | 'environment'
  | 'transportation'
  | 'business'
  | 'grounds'

export type SignalUrgency = 'blocking' | 'critical' | 'standard' | 'low'
export type SignalStatus = 'open' | 'claimed' | 'resolved' | 'waived'

export interface DivisionSignal {
  id: string
  sourceSite: string
  targetDivision: DivisionId
  assetId: string
  assetName: string
  stage: string
  title: string
  description: string
  urgency: SignalUrgency
  status: SignalStatus
  blocking: boolean
  payload?: Record<string, unknown>
  createdAt: string
  updatedAt: string
  resolvedAt?: string
  resolvedBy?: string
}

export interface SignalProposal {
  id: string
  targetDivision: DivisionId
  proposedBy: string
  ruleRef: string
  confidence: number
  payload: Record<string, unknown>
  createdAt: string
}

export interface RoutingRule {
  ruleId: string
  entityType: string
  event: string
  targetDivision: DivisionId
  urgency: SignalUrgency
  blocking: boolean
}

export interface KernelManifest {
  version: string
  divisions: DivisionId[]
  routingRules: RoutingRule[]
}
