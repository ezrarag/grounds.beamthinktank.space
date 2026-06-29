import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { AddPropertyForm } from '@/components/AddPropertyForm'
import { CityRegistryManager } from '@/components/CityRegistryManager'
import { CivicScanImport } from '@/components/CivicScanImport'

export default function ParticipantDashboardPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-10">
      <header className="space-y-3">
        <p className="eyebrow">Participant dashboard</p>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">Add sites &amp; cities</h1>
        <p className="max-w-2xl text-sm leading-7 text-white/70">
          Scan a city&apos;s civic records and publish sites to the public Properties page, add a new city, and
          associate a specific real-estate site with it. New sites you publish appear on the front end immediately.
        </p>
        <Link
          href="/portal/guide"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-grounds-sand hover:text-white"
        >
          Read the workflow guide
          <ArrowRight className="h-4 w-4" />
        </Link>
      </header>

      <div className="mt-8 space-y-5">
        <CivicScanImport />
        <CityRegistryManager />
        <AddPropertyForm />
      </div>
    </div>
  )
}
