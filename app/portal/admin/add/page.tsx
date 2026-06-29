import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { CityRegistryManager } from '@/components/CityRegistryManager'
import { CivicScanImport } from '@/components/CivicScanImport'
import { QuickAddProperty } from '@/components/QuickAddProperty'

export default function AdminAddPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-10">
      <Link
        href="/portal/admin"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-white/60 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Admin
      </Link>

      <header className="mt-4 space-y-2">
        <p className="eyebrow">Add</p>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">Add a property</h1>
        <p className="max-w-2xl text-sm leading-7 text-white/70">
          Add one site fast, scan a whole city, or register a new city — all in one place.
        </p>
      </header>

      <div className="mt-8 space-y-5">
        <QuickAddProperty />
        <div id="scan" className="scroll-mt-24">
          <CivicScanImport />
        </div>
        <div id="city" className="scroll-mt-24">
          <CityRegistryManager />
        </div>
      </div>
    </div>
  )
}
