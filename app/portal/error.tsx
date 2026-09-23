'use client'

import { useEffect } from 'react'
import { ShieldAlert, RefreshCw, LayoutDashboard } from 'lucide-react'
import Link from 'next/link'

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('App Router /portal root error boundary caught an exception:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#07110c] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-rose-500/30 bg-[#0d1c16] p-6 shadow-2xl space-y-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
          <ShieldAlert className="h-7 w-7" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-white">
            Portal Navigation Interrupted
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            An error occurred while loading this portal section. Please try resetting the view.
          </p>
          {error?.message && (
            <div className="mt-3 rounded-xl bg-black/50 border border-white/10 p-3 text-[11px] font-mono text-rose-300 text-left max-h-28 overflow-y-auto">
              {error.message}
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/portal/dashboard"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-white/10 transition"
          >
            <LayoutDashboard className="h-4 w-4 text-slate-400" />
            <span>Portal Home</span>
          </Link>

          <button
            onClick={() => reset()}
            type="button"
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow-lg"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Reset View</span>
          </button>
        </div>
      </div>
    </div>
  )
}
