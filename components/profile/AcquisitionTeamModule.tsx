'use client'

import { useState } from 'react'
import {
  CheckCircle2,
  Circle,
  FileCheck,
  ShieldAlert,
  UserCheck,
  UserPlus,
  Users,
  HardHat,
  Briefcase,
  FileSpreadsheet,
  Send,
} from 'lucide-react'
import type { ParcelResult } from '@/app/api/parcel/route'

export interface TeamMember {
  roleId: string
  title: string
  category: 'professional' | 'civic-labor'
  status: 'vacant' | 'attached'
  memberName?: string
  memberHandle?: string
}

interface AcquisitionTeamModuleProps {
  parcel: ParcelResult
  user: { uid?: string; displayName?: string | null; email?: string | null } | null
  onRoleClaimed?: (roleId: string, memberName: string) => void
}

export function AcquisitionTeamModule({ parcel, user, onRoleClaimed }: AcquisitionTeamModuleProps) {
  // Acquisition Path Logic based on parcel data
  const isDelinquent = (parcel.delinquent_tax_amount || 0) > 0 || parcel.tax_lien_status !== 'Clean / Current'
  const isPublicOrHomestead =
    parcel.ownerName.toLowerCase().includes('city') ||
    parcel.ownerName.toLowerCase().includes('county') ||
    parcel.assessedValue.toLowerCase().includes('exempt')

  const acquisitionPathType = isPublicOrHomestead
    ? '$1 Municipal Homestead Track'
    : isDelinquent
    ? 'Tax Certificate / In-Rem Purchase Track'
    : 'Commercial Real Estate Acquisition Track'

  const [checklist, setChecklist] = useState([
    { id: 'title', label: 'Title Search & Lien Encumbrance Audit', done: true },
    { id: 'phase1', label: 'Environmental Phase I Site Assessment', done: isPublicOrHomestead },
    { id: 'board', label: 'BEAM Board & Municipal Revitalization Authorization', done: false },
    { id: 'escrow', label: 'Closing Escrow & Deed Transfer', done: false },
  ])

  const [teamRoster, setTeamRoster] = useState<TeamMember[]>([
    {
      roleId: 'architect',
      title: 'Licensed Architect (AIA)',
      category: 'professional',
      status: 'vacant',
    },
    {
      roleId: 'engineer',
      title: 'Structural Engineer (PE)',
      category: 'professional',
      status: 'vacant',
    },
    {
      roleId: 'acoustician',
      title: 'Acoustic Specialist',
      category: 'professional',
      status: 'vacant',
    },
    {
      roleId: 'attorney',
      title: 'Real Estate & Land Trust Attorney',
      category: 'professional',
      status: 'vacant',
    },
    {
      roleId: 'captain',
      title: 'Site Stewardship Captain',
      category: 'civic-labor',
      status: user ? 'attached' : 'vacant',
      memberName: user?.displayName || 'Ezra Haugabrooks',
      memberHandle: user?.email ? `@${user.email.split('@')[0]}` : '@ezra.haugabrooks',
    },
    {
      roleId: 'demo-lead',
      title: 'Demolition & Deconstruction Lead',
      category: 'civic-labor',
      status: 'vacant',
    },
    {
      roleId: 'trade-electrician',
      title: 'Master Electrician / Trade Steward',
      category: 'civic-labor',
      status: 'vacant',
    },
    {
      roleId: 'liaison',
      title: 'Community Engagement Liaison',
      category: 'civic-labor',
      status: 'vacant',
    },
  ])

  const [inviteModalRole, setInviteModalRole] = useState<TeamMember | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteSent, setInviteSent] = useState(false)

  function toggleChecklist(id: string) {
    setChecklist((prev) => prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item)))
  }

  function handleClaimRole(roleId: string) {
    const name = user?.displayName || 'Signed-In Member'
    const handle = user?.email ? `@${user.email.split('@')[0]}` : '@member'

    setTeamRoster((prev) =>
      prev.map((role) =>
        role.roleId === roleId
          ? { ...role, status: 'attached', memberName: name, memberHandle: handle }
          : role
      )
    )

    if (onRoleClaimed) {
      onRoleClaimed(roleId, name)
    }
  }

  function handleSendInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviteSent(true)
    setTimeout(() => {
      setInviteSent(false)
      setInviteModalRole(null)
      setInviteEmail('')
    }, 1500)
  }

  return (
    <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Module Title & Path Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-slate-800" />
            <h3 className="text-base font-bold text-[#0f172a]">Acquisition &amp; Team Requirements</h3>
          </div>
          <p className="text-xs text-slate-500">
            Automated acquisition checklist and required team matrix for {parcel.address}.
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1 font-mono text-[10px] font-bold text-white shadow-sm">
          <FileCheck className="h-3.5 w-3.5 text-emerald-400" />
          {acquisitionPathType}
        </span>
      </div>

      {/* 1. Acquisition Checklist Section */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Step-by-Step Acquisition Checklist
        </h4>
        <div className="grid gap-2 sm:grid-cols-2">
          {checklist.map((step) => (
            <button
              key={step.id}
              onClick={() => toggleChecklist(step.id)}
              type="button"
              className={`flex items-center gap-2.5 rounded-2xl border p-3 text-left transition ${
                step.done
                  ? 'border-emerald-200 bg-emerald-50/60 text-emerald-950'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {step.done ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-slate-400" />
              )}
              <span className="text-xs font-medium">{step.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Team Roster Matrix Section */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Project Team Roster Matrix
          </h4>
          <span className="text-[10px] font-mono text-slate-400">
            {teamRoster.filter((r) => r.status === 'attached').length} of {teamRoster.length} Roles Filled
          </span>
        </div>

        {/* Professional Roster */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-slate-500">
            <Briefcase className="h-3.5 w-3.5 text-slate-700" /> Professional Roster
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {teamRoster
              .filter((r) => r.category === 'professional')
              .map((role) => (
                <div
                  key={role.roleId}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 p-3"
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-[#0f172a]">{role.title}</p>
                    {role.status === 'attached' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700">
                        <UserCheck className="h-3 w-3 text-emerald-600" /> {role.memberName} ({role.memberHandle})
                      </span>
                    ) : (
                      <span className="inline-block rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-amber-800">
                        [ Vacant ]
                      </span>
                    )}
                  </div>

                  <div>
                    {role.status === 'attached' ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800">
                        Attached
                      </span>
                    ) : (
                      <button
                        onClick={() => setInviteModalRole(role)}
                        type="button"
                        className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-800 hover:bg-slate-100 shadow-sm transition"
                      >
                        <UserPlus className="h-3 w-3" /> Invite
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Civic & Labor Roster */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-slate-500">
            <HardHat className="h-3.5 w-3.5 text-slate-700" /> Civic &amp; Labor Roster
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {teamRoster
              .filter((r) => r.category === 'civic-labor')
              .map((role) => (
                <div
                  key={role.roleId}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 p-3"
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-[#0f172a]">{role.title}</p>
                    {role.status === 'attached' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700">
                        <UserCheck className="h-3 w-3 text-emerald-600" /> {role.memberName} ({role.memberHandle})
                      </span>
                    ) : (
                      <span className="inline-block rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-amber-800">
                        [ Vacant ]
                      </span>
                    )}
                  </div>

                  <div>
                    {role.status === 'attached' ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800">
                        Attached
                      </span>
                    ) : (
                      <button
                        onClick={() => handleClaimRole(role.roleId)}
                        type="button"
                        className="inline-flex items-center gap-1 rounded-full bg-[#1e293b] px-3 py-1 text-[10px] font-semibold text-white hover:bg-slate-900 shadow-sm transition"
                      >
                        <UserCheck className="h-3 w-3 text-emerald-400" /> Claim Role
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Invite Modal Dialog */}
      {inviteModalRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h4 className="text-base font-bold text-[#0f172a]">
              Invite Specialist: {inviteModalRole.title}
            </h4>
            <p className="mt-1 text-xs text-slate-500">
              Send an invitation to a licensed professional or partner to join the property team for {parcel.address}.
            </p>

            {inviteSent ? (
              <div className="my-6 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-center text-xs font-semibold text-emerald-800">
                Invitation sent to {inviteEmail}!
              </div>
            ) : (
              <form onSubmit={handleSendInvite} className="mt-4 space-y-3">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="specialist@firm.com"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-800 focus:border-slate-400 focus:outline-none"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setInviteModalRole(null)}
                    type="button"
                    className="rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#1e293b] px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-900 shadow-sm transition"
                  >
                    <Send className="h-3.5 w-3.5 text-emerald-400" /> Send Invite
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
