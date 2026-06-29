// Shared media model used across the front end (display) and back end (admin).
// A property has an optional hero image plus an ordered media gallery. Helpers
// take a light structural source so this file stays free of circular imports.

export type MediaKind = 'image' | 'video'

export interface MediaItem {
  type: MediaKind
  url: string
  caption?: string
}

export interface MediaSource {
  heroImageUrl?: string
  media?: MediaItem[]
  /** Legacy/seed single-image fallback. */
  imageUrl?: string
}

/** The single image to feature (hero, else first gallery image, else legacy). */
export function heroImage(source: MediaSource): string | undefined {
  if (source.heroImageUrl) return source.heroImageUrl
  const firstImage = source.media?.find((item) => item.type === 'image')
  return firstImage?.url ?? source.imageUrl
}

export function galleryItems(source: MediaSource): MediaItem[] {
  return source.media ?? []
}

export function hasMedia(source: MediaSource): boolean {
  return Boolean(heroImage(source)) || galleryItems(source).length > 0
}
