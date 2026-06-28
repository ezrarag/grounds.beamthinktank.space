import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { DM_Mono, DM_Sans, Playfair_Display, Space_Grotesk } from 'next/font/google'
import { AppHeader } from '@/components/AppHeader'
import { AuthBootstrapper } from '@/components/AuthBootstrapper'
import { ConditionalFooter } from '@/components/ConditionalFooter'
import { groundsConfig } from '@/lib/ngoConfig'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-dm-mono',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
})

const fontVariables = `${spaceGrotesk.variable} ${dmSans.variable} ${dmMono.variable} ${playfair.variable}`

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
    <html lang="en" className={fontVariables}>
      <body className="min-h-screen bg-[#07100c] text-white antialiased">
        <AuthBootstrapper />
        <div className="relative flex min-h-screen flex-col overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-grounds-grid bg-[size:40px_40px] opacity-[0.05]" />
          <AppHeader config={groundsConfig} />
          <main className="relative z-10 flex flex-1 flex-col">{children}</main>
          <ConditionalFooter />
        </div>
      </body>
    </html>
  )
}
