'use client'

import { useEffect, useRef } from 'react'

export interface SelectedPlace {
  address: string
  lat?: number
  lng?: number
  city?: string
  state?: string
}

type GooglePlace = {
  formatted_address?: string
  geometry?: { location?: { lat?: () => number; lng?: () => number } }
  address_components?: Array<{ types: string[]; long_name: string; short_name: string }>
}
type GoogleAutocomplete = {
  addListener: (event: string, handler: () => void) => void
  getPlace: () => GooglePlace
}
type GoogleNS = {
  maps?: {
    places?: { Autocomplete: new (input: HTMLInputElement, options: unknown) => GoogleAutocomplete }
  }
}

let placesPromise: Promise<void> | null = null

function loadPlaces(key: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'))
  const w = window as unknown as { google?: { maps?: { places?: unknown } } }
  if (w.google?.maps?.places) return Promise.resolve()
  if (placesPromise) return placesPromise

  placesPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`
    script.async = true
    script.dataset.googlePlaces = 'true'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Places'))
    document.head.appendChild(script)
  })
  return placesPromise
}

/**
 * Address input with Google Places autocomplete when a Maps key is configured;
 * falls back to a plain text input otherwise. Always controlled by `value`.
 */
export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
  className,
}: {
  value: string
  onChange: (value: string) => void
  onSelect?: (place: SelectedPlace) => void
  placeholder?: string
  className?: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  useEffect(() => {
    if (!key || !ref.current) return
    let cancelled = false

    loadPlaces(key)
      .then(() => {
        if (cancelled || !ref.current) return
        const g = (window as unknown as { google?: GoogleNS }).google
        if (!g?.maps?.places) return

        const autocomplete = new g.maps.places.Autocomplete(ref.current, {
          types: ['address'],
          fields: ['formatted_address', 'geometry', 'address_components'],
        })

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace()
          const address = place.formatted_address ?? ref.current?.value ?? ''
          const lat = place.geometry?.location?.lat?.()
          const lng = place.geometry?.location?.lng?.()
          let city: string | undefined
          let state: string | undefined
          for (const component of place.address_components ?? []) {
            if (component.types.includes('locality')) city = component.long_name
            if (component.types.includes('administrative_area_level_1')) state = component.short_name
          }
          onChange(address)
          onSelect?.({ address, lat, lng, city, state })
        })
      })
      .catch(() => undefined)

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return (
    <input
      ref={ref}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className={className}
    />
  )
}
