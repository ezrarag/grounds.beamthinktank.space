'use client'

import { Building2, Compass, Layers, Users } from 'lucide-react'

export type AdminRoleContext = 'acquisition' | 'cohort' | 'dispatcher'

export interface AdminRoleConfig {
  id: AdminRoleContext
  label: string
  subtitle: string
  icon: typeof Building2
  badgeColor: string
}

export const ADMIN_ROLES: AdminRoleConfig[] = [
  {
    id: 'acquisition',
    label: 'Acquisition Lead',
    subtitle: 'Property intake, title records, civic scans & parcel scoping',
    icon: Building2,
    badgeColor: 'border-amber-300 bg-amber-400/10 text-amber-[#1e293b]',
  },
  {
    id: 'cohort',
    label: 'Cohort Manager',
    subtitle: 'Participant routing, sweat-equity, Path-to-Deed & role interest queue',
    icon: Users,
    badgeColor: 'border-[#1e293b] bg-slate-900 text-white',
  },
  {
    id: 'dispatcher',
    label: 'Network Dispatcher',
    subtitle: 'Live map, participant location beacons & proximity matching',
    icon: Compass,
    badgeColor: 'border-emerald-300 bg-emerald-400/10 text-emerald-800',
  },
]

export interface AdminRoleSwitcherProps {
  activeRole: AdminRoleContext
  onRoleChange: (role: AdminRoleContext) => void
  className?: string
}

export function AdminRoleSwitcher({
  activeRole,
  onRoleChange,
  className = '',
}: AdminRoleSwitcherProps) {
  const current = ADMIN_ROLES.find((r) => r.id === activeRole) || ADMIN_ROLES[0]

  return (
    <div className={`rounded-3xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-slate-700" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Admin Operational Context Switcher
          </span>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-mono text-slate-600">
          Active Mode: <strong className="text-[#0f172a]">{current.label}</strong>
        </span>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {ADMIN_ROLES.map((role) => {
          const Icon = role.icon
          const isSelected = activeRole === role.id
          return (
            <button
              key={role.id}
              onClick={() => onRoleChange(role.id)}
              type="button"
              className={`flex flex-col justify-between rounded-2xl border p-4 text-left transition ${
                isSelected
                  ? 'border-[#1e293b] bg-[#1e293b] text-white shadow-md'
                  : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300 hover:bg-slate-100'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <Icon
                    className={`h-5 w-5 ${isSelected ? 'text-sky-300' : 'text-slate-700'}`}
                  />
                  {isSelected && (
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-300 border border-emerald-400/30">
                      ACTIVE
                    </span>
                  )}
                </div>
                <h3 className="mt-2 text-sm font-bold">{role.label}</h3>
                <p
                  className={`mt-1 text-[11px] leading-relaxed ${
                    isSelected ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {role.subtitle}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
