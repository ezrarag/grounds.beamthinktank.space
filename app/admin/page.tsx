'use client'

import Link from 'next/link'
import { ArrowLeft, ShieldCheck, Building2, Users, Layers } from 'lucide-react'
import { useUserRole } from '@/lib/roles'
import { RedevelopmentPipelineBoard } from '@/components/redevelopment/RedevelopmentPipelineBoard'

export default function AdminDashboardPage() {
  const { isAdmin, isCohortManager, loading } = useUserRole()

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center text-sm font-medium text-slate-400">
        Verifying admin authorization...
      </div>
    )
  }

  if (!isAdmin && !isCohortManager) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 space-y-4">
          <ShieldCheck className="mx-auto h-10 w-10 text-rose-600" />
          <h1 className="text-2xl font-bold text-rose-950">Admin Authorization Required</h1>
          <p className="text-xs text-rose-800 max-w-md mx-auto leading-relaxed">
            This surface is restricted to BEAM Grounds Admins and Cohort Managers. Please sign in with an authorized account to view portfolio-level redevelopment projects.
          </p>
          <Link
            href="/portal"
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Portal
          </Link>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        <header className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-3 text-amber-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  BEAM Grounds Executive Console
                </span>
              </div>
              <h1 className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">
                Redevelopment Pipeline Admin
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/portal/admin"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
            >
              Portal Admin <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
            </Link>
          </div>
        </header>

        {/* Pipeline Status Board - Admin View */}
        <section>
          <RedevelopmentPipelineBoard viewMode="admin" />
        </section>
      </div>
    </main>
  )
}
