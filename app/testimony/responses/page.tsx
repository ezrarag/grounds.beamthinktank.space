'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { Download, FileJson } from 'lucide-react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { PortalAuthGuard } from '@/components/PortalAuthGuard'
import { PortalPageShell } from '@/components/PortalPageShell'
import { db } from '@/lib/firebase'
import { CONSENT_LEVELS, TESTIMONY_DISCIPLINES, type ConsentLevel, type TestimonyDiscipline } from '@/lib/surveys/facilitiesTestimony'
import { useIsAdmin } from '@/lib/useIsAdmin'

interface TestimonyRecord {
  id: string
  createdAt?: { toDate?: () => Date } | null
  discipline?: TestimonyDiscipline
  consentLevel?: ConsentLevel | null
  hasDocumentation?: boolean
  contact?: string
  mode?: 'self' | 'interview'
  enteredBy?: string
  responses?: Record<string, unknown>
}

function formatDate(value: TestimonyRecord['createdAt']) {
  if (!value?.toDate) return 'Pending timestamp'
  return value.toDate().toLocaleString()
}

function exportResponses(rows: TestimonyRecord[]) {
  const payload = rows.map((row) => ({
    ...row,
    createdAt: row.createdAt?.toDate ? row.createdAt.toDate().toISOString() : null,
  }))
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `grounds-testimonies-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  window.URL.revokeObjectURL(url)
}

function ResponsesAdminList() {
  const [rows, setRows] = useState<TestimonyRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isAdmin, ready, email } = useIsAdmin()

  useEffect(() => {
    if (!db) {
      setError('Firestore is not configured.')
      setLoading(false)
      return
    }

    const unsubscribe = onSnapshot(
      query(collection(db, 'groundsTestimonies'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        setRows(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<TestimonyRecord, 'id'>),
          })),
        )
        setLoading(false)
      },
      (snapshotError) => {
        setError(snapshotError.message || 'Unable to load testimonies.')
        setLoading(false)
      },
    )

    return unsubscribe
  }, [])

  const emptyState = useMemo(() => {
    if (loading) return 'Loading submissions...'
    if (error) return error
    return 'No testimony submissions yet.'
  }, [error, loading])

  return (
    <PortalPageShell
      title="Testimony responses"
      description="Review incoming testimony submissions and export the current dataset as JSON."
    >
      {!ready ? (
        <div className="surface-panel p-6 text-sm text-white/64 shadow-grounds">Checking admin access...</div>
      ) : !isAdmin ? (
        <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5 text-sm leading-7 text-white/60">
          This view is limited to Grounds admins. Signed-in account: {email ?? 'unknown'}.
        </section>
      ) : rows.length === 0 || error || loading ? (
        <div className="surface-panel p-6 text-sm text-white/64 shadow-grounds">{emptyState}</div>
      ) : (
        <div className="space-y-5">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => exportResponses(rows)}
              className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-[#0b1712]"
              style={{ backgroundColor: '#c8b97a' }}
            >
              <Download className="h-4 w-4" />
              Export JSON
            </button>
          </div>

          <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.03]">
            <table className="min-w-full divide-y divide-white/8 text-left text-sm">
              <thead className="bg-white/[0.03] text-white/48">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Discipline</th>
                  <th className="px-4 py-3 font-medium">Consent</th>
                  <th className="px-4 py-3 font-medium">Documentation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8">
                {rows.map((row) => (
                  <tr key={row.id} className="align-top">
                    <td className="px-4 py-4 text-white/72">
                      <details>
                        <summary className="cursor-pointer list-none">
                          <div className="flex items-center gap-2">
                            <FileJson className="h-4 w-4 text-grounds-sand" />
                            <span>{formatDate(row.createdAt)}</span>
                          </div>
                        </summary>
                        <div className="mt-4 max-w-3xl rounded-2xl border border-white/10 bg-[#12211c] p-4 text-xs leading-6 text-white/70">
                          <pre className="overflow-x-auto whitespace-pre-wrap font-mono">
                            {JSON.stringify(
                              {
                                mode: row.mode,
                                enteredBy: row.enteredBy,
                                contact: row.contact,
                                responses: row.responses,
                              },
                              null,
                              2,
                            )}
                          </pre>
                        </div>
                      </details>
                    </td>
                    <td className="px-4 py-4 text-white/72">
                      {TESTIMONY_DISCIPLINES.find((option) => option.value === row.discipline)?.label ?? row.discipline ?? 'Unknown'}
                    </td>
                    <td className="px-4 py-4 text-white/72">
                      {CONSENT_LEVELS.find((option) => option.value === row.consentLevel)?.label ?? row.consentLevel ?? 'Unknown'}
                    </td>
                    <td className="px-4 py-4 text-white/72">{row.hasDocumentation ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PortalPageShell>
  )
}

export default function TestimonyResponsesPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-10">
          <section className="surface-panel p-8 text-white/72">Checking your BEAM Grounds portal session...</section>
        </div>
      }
    >
      <PortalAuthGuard>
        <ResponsesAdminList />
      </PortalAuthGuard>
    </Suspense>
  )
}
