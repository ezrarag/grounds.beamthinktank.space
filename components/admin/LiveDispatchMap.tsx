'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Compass,
  Home,
  MapPin,
  Navigation,
  Radio,
  ShieldCheck,
  UserCheck,
  Zap,
} from 'lucide-react'
import type { BeamAsset } from '@/lib/useAcquisitionSites'
import { CITY_HOMESTEAD_SITES, type PropertySiteOption } from '@/components/profile/PropertyMatcherModal'

export interface ParticipantBeacon {
  uid: string
  displayName: string
  handle: string
  cityState: string
  lat: number
  lng: number
  isBroadcasting: boolean
  skills: string[]
  sweatEquityHours: number
}

export const SEEDED_PARTICIPANT_BEACONS: ParticipantBeacon[] = [
  {
    uid: 'ezra-001',
    displayName: 'Ezra Haugabrooks',
    handle: '@ezra.haugabrooks',
    cityState: 'Milwaukee, WI',
    lat: 43.041,
    lng: -87.942,
    isBroadcasting: true,
    skills: ['Violinist', 'Luthier Apprentice', 'Material Movement'],
    sweatEquityHours: 72,
  },
  {
    uid: 'participant-002',
    displayName: 'Marcus Vance',
    handle: '@marcus_vance',
    cityState: 'Milwaukee, WI',
    lat: 43.045,
    lng: -87.935,
    isBroadcasting: true,
    skills: ['Carpentry & Framing', 'Drywall', 'Demolition'],
    sweatEquityHours: 110,
  },
  {
    uid: 'participant-003',
    displayName: 'Elena Rios',
    handle: '@elena_rios',
    cityState: 'Atlanta, GA',
    lat: 33.754,
    lng: -84.372,
    isBroadcasting: true,
    skills: ['Architectural Survey', 'Permits', 'Site Stewardship'],
    sweatEquityHours: 95,
  },
]

export interface LiveDispatchMapProps {
  sites?: BeamAsset[]
  onDispatch?: (participant: ParticipantBeacon, property: PropertySiteOption | BeamAsset) => void
}

// Distance calculation between two lat/lng coordinates in miles
function getDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8 // Radius of the Earth in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c * 10) / 10
}

export function LiveDispatchMap({ sites, onDispatch }: LiveDispatchMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const [selectedBeacon, setSelectedBeacon] = useState<ParticipantBeacon | null>(
    SEEDED_PARTICIPANT_BEACONS[0],
  )
  const [selectedSite, setSelectedSite] = useState<PropertySiteOption>(CITY_HOMESTEAD_SITES[0])
  const [mapLoaded, setMapLoaded] = useState(false)

  // Initialize Mapbox GL JS map
  useEffect(() => {
    let isSubscribed = true

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return
      try {
        let mapboxgl: any = (window as any).mapboxgl
        if (!mapboxgl) {
          mapboxgl = (await import('mapbox-gl')).default
        }

        if (!document.getElementById('mapbox-gl-css')) {
          const link = document.createElement('link')
          link.id = 'mapbox-gl-css'
          link.rel = 'stylesheet'
          link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.1.0/mapbox-gl.css'
          document.head.appendChild(link)
        }

        mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''

        if (!isSubscribed || mapRef.current) return

        const map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: 'mapbox://styles/mapbox/dark-v11',
          center: [-87.940, 43.040], // Milwaukee center
          zoom: 12,
        })

        mapRef.current = map

        map.on('load', () => {
          if (!isSubscribed) return
          setMapLoaded(true)

          // Add Property Markers
          CITY_HOMESTEAD_SITES.forEach((site) => {
            const lat = site.city.includes('Milwaukee') ? 43.0396 : 33.754
            const lng = site.city.includes('Milwaukee') ? -87.945 : -84.372

            const el = document.createElement('div')
            el.className =
              'flex h-7 w-7 items-center justify-center rounded-full bg-[#1e293b] border-2 border-amber-400 text-amber-300 font-bold text-xs shadow-lg cursor-pointer'
            el.innerHTML = '🏠'
            el.title = `${site.name} (${site.parcelId})`

            new mapboxgl.Marker(el).setLngLat([lng, lat]).addTo(map)
          })

          // Add Live Participant Beacons
          SEEDED_PARTICIPANT_BEACONS.forEach((beacon) => {
            const el = document.createElement('div')
            el.className =
              'relative flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 border-2 border-white text-white font-bold text-xs shadow-xl cursor-pointer ring-4 ring-emerald-500/30'
            el.innerHTML = '👤'
            el.title = `${beacon.displayName} (${beacon.handle})`

            new mapboxgl.Marker(el).setLngLat([beacon.lng, beacon.lat]).addTo(map)
          })
        })
      } catch (err) {
        console.warn('Mapbox GL initialization fallback:', err)
      }
    }

    void initMap()

    return () => {
      isSubscribed = false
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  const distance = selectedBeacon
    ? getDistanceMiles(selectedBeacon.lat, selectedBeacon.lng, 43.0396, -87.945)
    : 1.2

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-[#0f172a] text-white shadow-xl">
      {/* Dispatch Map Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 bg-[#1e293b] p-4">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight">Live Network Dispatcher Map</h3>
            <p className="text-xs text-slate-400">
              Life360-style real-time participant beacons &amp; property proximity match
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 font-mono text-[10px] font-bold text-emerald-300">
            {SEEDED_PARTICIPANT_BEACONS.length} Live Beacons Active
          </span>
        </div>
      </div>

      {/* Map Container & Dispatch Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Left: Map Canvas (8 cols) */}
        <div className="relative h-96 lg:col-span-8">
          <div ref={mapContainerRef} className="h-full w-full bg-slate-900" />
          {!mapLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 p-6 text-center text-slate-400">
              <Compass className="h-8 w-8 animate-spin text-emerald-400" />
              <p className="mt-2 text-xs font-mono">Initializing spatial network map...</p>
            </div>
          )}
        </div>

        {/* Right: Proximity & Dispatch Controls (4 cols) */}
        <div className="flex flex-col justify-between border-t border-slate-800 bg-[#121e2b] p-5 lg:col-span-4 lg:border-l lg:border-t-0">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-mono text-xs uppercase tracking-wider text-slate-400">
                Proximity Dispatch
              </span>
              <span className="font-mono text-xs text-emerald-400">{distance} miles away</span>
            </div>

            {/* Selected Participant */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Select Active Participant Beacon
              </label>
              <select
                value={selectedBeacon?.uid}
                onChange={(e) => {
                  const matched = SEEDED_PARTICIPANT_BEACONS.find((b) => b.uid === e.target.value)
                  if (matched) setSelectedBeacon(matched)
                }}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-white focus:border-emerald-400 focus:outline-none"
              >
                {SEEDED_PARTICIPANT_BEACONS.map((beacon) => (
                  <option key={beacon.uid} value={beacon.uid}>
                    {beacon.displayName} ({beacon.cityState})
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Property Site */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Select Target Property Site
              </label>
              <select
                value={selectedSite.id}
                onChange={(e) => {
                  const matched = CITY_HOMESTEAD_SITES.find((s) => s.id === e.target.value)
                  if (matched) setSelectedSite(matched)
                }}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-white focus:border-emerald-400 focus:outline-none"
              >
                {CITY_HOMESTEAD_SITES.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name} — TAXKEY {site.parcelId}
                  </option>
                ))}
              </select>
            </div>

            {/* Match Summary Card */}
            {selectedBeacon && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{selectedBeacon.displayName}</span>
                  <span className="font-mono text-emerald-400 text-[10px]">
                    {selectedBeacon.sweatEquityHours} hrs Equity
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedBeacon.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-mono text-slate-300 border border-slate-700"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              if (selectedBeacon && onDispatch) {
                onDispatch(selectedBeacon, selectedSite)
              }
            }}
            type="button"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-center text-xs font-bold text-white shadow-lg transition hover:bg-emerald-500"
          >
            <Zap className="h-4 w-4" />
            Dispatch Participant to Site Work Shift
          </button>
        </div>
      </div>
    </div>
  )
}
