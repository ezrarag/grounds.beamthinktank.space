import Link from 'next/link'
import type { NGOConfig } from '@/lib/ngoConfig'

export function SiteFooter({ config }: { config: NGOConfig }) {
  return (
    <footer className="border-t border-grounds-line bg-[#08110d]">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 text-sm text-white/68 sm:px-6 lg:grid-cols-[1.6fr_1fr_1fr] lg:px-10">
        <div>
          <p className="text-xs uppercase tracking-[0.24em]" style={{ color: config.primaryColor }}>
            {config.name}
          </p>
          <p className="mt-3 max-w-xl text-white/78">{config.description}</p>
        </div>
        <div>
          <p className="font-semibold text-white">Routes</p>
          <div className="mt-3 space-y-2">
            <Link href="/about" className="block hover:text-white">
              About
            </Link>
            <Link href="/portal" className="block hover:text-white">
              Portal
            </Link>
            <Link href={`/tracks/${config.tracks[0]?.slug ?? ''}`} className="block hover:text-white">
              Track Briefs
            </Link>
          </div>
        </div>
        <div>
          <p className="font-semibold text-white">Network</p>
          <div className="mt-3 space-y-2">
            <a href={config.beamHomeUrl} target="_blank" rel="noreferrer" className="block hover:text-white">
              BEAM Home
            </a>
            <a href={config.siteUrl || '#'} target="_blank" rel="noreferrer" className="block hover:text-white">
              {config.subdomain}.beamthinktank.space
            </a>
            <a href="/portal" className="block hover:text-white">
              Authenticated workspace
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
