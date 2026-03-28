'use client'

import { useState, type FormEvent } from 'react'
import type { NGOConfig } from '@/lib/ngoConfig'

export function SubscribeForm({ config, compact = false }: { config: NGOConfig; compact?: boolean }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState(`Receive ${config.name} track briefings and redevelopment updates.`)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('loading')
    setMessage('Submitting...')

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: `${config.id}-public-subscribe` }),
      })

      const payload = (await response.json().catch(() => ({}))) as { error?: string; message?: string }

      if (!response.ok) {
        throw new Error(payload.error || 'Subscription failed.')
      }

      setStatus('success')
      setEmail('')
      setMessage(payload.message || `Subscription captured. You will receive ${config.name} updates.`)
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Unable to save your subscription right now.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className={compact ? 'flex flex-col gap-3 sm:flex-row' : 'flex flex-col gap-3 lg:flex-row'}>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email address"
          required
          className="min-h-12 flex-1 rounded-2xl border border-white/12 bg-white/[0.04] px-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-grounds-sage"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="min-h-12 rounded-2xl px-5 text-sm font-semibold text-[#0b1712] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
          style={{ backgroundColor: config.primaryColor }}
        >
          {status === 'loading' ? 'Submitting...' : 'Subscribe'}
        </button>
      </div>
      <p className={`text-sm ${status === 'error' ? 'text-red-300' : status === 'success' ? 'text-emerald-300' : 'text-white/62'}`}>
        {message}
      </p>
    </form>
  )
}
