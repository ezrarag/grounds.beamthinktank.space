'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'

function buildNextQueryParam(pathname: string, searchParams: ReturnType<typeof useSearchParams>): string {
  const queryStr = searchParams?.toString() ?? ''
  return `${pathname}${queryStr ? `?${queryStr}` : ''}`
}

export function PortalAuthGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const next = buildNextQueryParam(pathname, searchParams)

    if (!auth) {
      router.replace(`/login?next=${encodeURIComponent(next)}`)
      return
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        if (user) {
          setIsChecking(false)
          return
        }

        router.replace(`/login?next=${encodeURIComponent(next)}`)
      },
      () => {
        router.replace(`/login?next=${encodeURIComponent(next)}`)
      },
    )

    return unsubscribe
  }, [pathname, router, searchParams])

  if (isChecking) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-10">
        <section className="surface-panel p-8 text-white/72">Checking your BEAM Grounds portal session...</section>
      </div>
    )
  }

  return <>{children}</>
}
