import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Space_Grotesk } from 'next/font/google'
import { AppHeader } from '@/components/AppHeader'
import { AuthBootstrapper } from '@/components/AuthBootstrapper'
import { SiteFooter } from '@/components/SiteFooter'
import { groundsConfig } from '@/lib/ngoConfig'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
})

function buildMetadataBase(siteUrl: string) {
  if (!siteUrl.trim()) return undefined

  try {
    return new URL(siteUrl)
  } catch {
    return undefined
  }
}

export const metadata: Metadata = {
  metadataBase: buildMetadataBase(groundsConfig.siteUrl),
  title: groundsConfig.name,
  description: groundsConfig.description,
  icons: {
    icon: '/icon.svg',
  },
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={spaceGrotesk.variable}>
      <body className="min-h-screen bg-[#07100c] text-white antialiased">
        <AuthBootstrapper />
        <div className="relative min-h-screen overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-grounds-grid bg-[size:40px_40px] opacity-[0.05]" />
          <AppHeader config={groundsConfig} />
          <main className="relative z-10">{children}</main>
          <SiteFooter config={groundsConfig} />
        </div>
      </body>
    </html>
  )
}
