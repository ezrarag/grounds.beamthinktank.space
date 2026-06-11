'use client'

import { Suspense, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, type User } from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db, signInWithGoogle } from '@/lib/firebase'
import { resolvePortalPath } from '@/lib/resolvePortalPath'

async function readRole(user: User) {
  const tokenResult = await user.getIdTokenResult().catch(() => null)
  const roleClaim = tokenResult?.claims.role ?? tokenResult?.claims.beamRole

  if (typeof roleClaim === 'string' && roleClaim.trim()) {
    return roleClaim.trim()
  }

  if (db) {
    const membership = await getDoc(doc(db, 'memberships', user.uid)).catch(() => null)
    const role = membership?.data()?.role

    if (typeof role === 'string' && role.trim()) {
      return role.trim()
    }
  }

  return 'community'
}

async function writeMembership(user: User, role: string, pathwayRole: string | null, chapter: string | null) {
  if (!db) return

  await setDoc(
    doc(db, 'memberships', user.uid),
    {
      uid: user.uid,
      email: user.email ?? null,
      displayName: user.displayName ?? null,
      role,
      ...(pathwayRole ? { pathwayRole } : {}),
      ...(chapter ? { chapter } : {}),
      provider: user.providerData[0]?.providerId ?? 'password',
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next')
  const pathwayRole = searchParams.get('role')
  const chapter = searchParams.get('chapter')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'sign-in' | 'create'>('sign-in')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const safeNext = useMemo(() => {
    if (!next?.startsWith('/')) return null
    if (next.startsWith('//')) return null
    return next
  }, [next])

  async function completeLogin(user: User) {
    const role = await readRole(user)
    await writeMembership(user, role, pathwayRole, chapter)
    router.replace(safeNext ?? resolvePortalPath({ pathwayRole, role }))
  }

  useEffect(() => {
    if (!auth) return

    return onAuthStateChanged(auth, (user) => {
      if (!user) return
      void completeLogin(user)
    })
    // The redirect target is intentionally resolved from the current query string.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeNext])

  async function handleGoogleSignIn() {
    setError(null)
    setIsSubmitting(true)

    try {
      const result = await signInWithGoogle()
      await completeLogin(result.user)
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : 'Unable to sign in with Google.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    if (!auth) {
      setError('Firebase is not configured.')
      setIsSubmitting(false)
      return
    }

    try {
      const result =
        mode === 'create'
          ? await createUserWithEmailAndPassword(auth, email, password)
          : await signInWithEmailAndPassword(auth, email, password)

      await completeLogin(result.user)
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : 'Unable to sign in.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl items-center px-4 py-12 sm:px-6 lg:px-10">
      <section className="surface-panel w-full p-8 shadow-grounds">
        <p className="eyebrow">BEAM Grounds</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Sign in</h1>
        <p className="mt-3 text-sm leading-7 text-white/66">
          Sign in to continue into the protected Grounds portal.
        </p>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isSubmitting}
          className="mt-6 w-full rounded-full bg-grounds-sand px-5 py-3 text-sm font-semibold text-[#0b1712] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Continue with Google
        </button>

        <form onSubmit={handleEmailSubmit} className="mt-6 space-y-4">
          <label className="block text-sm text-white/70">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="mt-1 w-full rounded-2xl border border-white/10 bg-[#12211c] px-4 py-3 text-white outline-none focus:border-grounds-sand/50"
            />
          </label>
          <label className="block text-sm text-white/70">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              className="mt-1 w-full rounded-2xl border border-white/10 bg-[#12211c] px-4 py-3 text-white outline-none focus:border-grounds-sand/50"
            />
          </label>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full border border-white/14 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {mode === 'create' ? 'Create account' : 'Sign in with email'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode((current) => (current === 'create' ? 'sign-in' : 'create'))}
          className="mt-4 text-sm text-grounds-sand"
        >
          {mode === 'create' ? 'Already have an account? Sign in.' : 'Need an account? Create one.'}
        </button>

        {error ? <p className="mt-4 text-sm text-red-100">{error}</p> : null}
      </section>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-[70vh] max-w-xl items-center px-4 py-12 sm:px-6 lg:px-10">
          <section className="surface-panel w-full p-8 text-white/72 shadow-grounds">Loading sign-in...</section>
        </main>
      }
    >
      <LoginPageContent />
    </Suspense>
  )
}
