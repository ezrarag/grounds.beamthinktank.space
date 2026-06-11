'use client'

import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { NGOConfig, Pathway, PathwayMedia, PathwayRole } from '@/lib/ngoConfig'

export type PathwayMediaOverrides = Partial<Record<PathwayRole, Partial<PathwayMedia>>>

function mergePathways(pathways: Pathway[], overrides: PathwayMediaOverrides | undefined) {
  if (!overrides) return pathways

  return pathways.map((pathway) => {
    const override = overrides[pathway.role]
    if (!override) return pathway

    return {
      ...pathway,
      mediaType: override.mediaType ?? pathway.mediaType,
      mediaUrl: override.mediaUrl ?? pathway.mediaUrl,
    }
  })
}

export function pathwayConfigDocPath(config: NGOConfig): [string, string] {
  return ['configs', config.subdomain]
}

export function usePathwayConfig(config: NGOConfig) {
  const [pathways, setPathways] = useState<Pathway[]>(config.pathways)

  useEffect(() => {
    if (!db) return

    const [collectionId, docId] = pathwayConfigDocPath(config)

    return onSnapshot(
      doc(db, collectionId, docId),
      (snapshot) => {
        const overrides = snapshot.data()?.pathwayMedia as PathwayMediaOverrides | undefined
        setPathways(mergePathways(config.pathways, overrides))
      },
      () => setPathways(config.pathways),
    )
  }, [config])

  return pathways
}
