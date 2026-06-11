'use client'

import { PathwaySelector } from '@/components/PathwaySelector'
import { groundsConfig } from '@/lib/ngoConfig'
import { usePathwayConfig } from '@/lib/usePathwayConfig'

export function HomePathways() {
  const pathways = usePathwayConfig(groundsConfig)

  return (
    <PathwaySelector
      pathways={pathways}
      chapters={groundsConfig.chapters}
      divisionName={groundsConfig.name}
    />
  )
}
