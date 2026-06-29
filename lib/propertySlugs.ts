import type { BeamAsset } from '@/lib/useAcquisitionSites'

export function slugifyPropertyLabel(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function getPropertySlug(site: Pick<BeamAsset, 'name' | 'publicTitle'>) {
  return slugifyPropertyLabel(site.publicTitle || site.name)
}

export function getPropertyHref(site: Pick<BeamAsset, 'name' | 'publicTitle'>) {
  return `/properties/${getPropertySlug(site)}`
}

