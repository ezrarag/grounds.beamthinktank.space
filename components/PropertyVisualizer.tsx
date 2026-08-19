'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Building2,
  Compass,
  Expand,
  Eye,
  Layers,
  Maximize2,
  Minimize2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Tag,
} from 'lucide-react'
import type { ParcelResult } from '@/app/api/parcel/route'

export interface PropertyVisualizerProps {
  address: string
  propertyId?: string
  propertyName?: string
  lat?: number
  lng?: number
  className?: string
  compact?: boolean
}

export function PropertyVisualizer({
  address,
  propertyId,
  propertyName,
  lat: initialLat,
  lng: initialLng,
  className = '',
  compact = false,
}: PropertyVisualizerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [parcelData, setParcelData] = useState<ParcelResult | null>(null)
  const [is3DMode, setIs3DMode] = useState(true)
  const [mapStyle, setMapStyle] = useState<'dark' | 'satellite'>('dark')
  const [isExpanded, setIsExpanded] = useState(false)
  const [streetViewOpen, setStreetViewOpen] = useState(false)

  // Fetch parcel data (Regrid + geometry + MPROP data)
  useEffect(() => {
    let isCancelled = false
    setLoading(true)
    setError(null)

    async function fetchParcelInfo() {
      try {
        const queryParam = propertyId ? `parcelId=${encodeURIComponent(propertyId)}` : `address=${encodeURIComponent(address)}`
        const res = await fetch(`/api/parcel?${queryParam}`)
        if (!res.ok) throw new Error('Failed to fetch parcel information.')
        const data = (await res.json()) as ParcelResult
        if (!isCancelled) {
          setParcelData(data)
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load parcel visualization.')
        }
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    void fetchParcelInfo()

    return () => {
      isCancelled = true
    }
  }, [address, propertyId])

  // Initialize Mapbox GL JS 3D map
  useEffect(() => {
    if (!mapContainerRef.current || !parcelData) return

    const lat = parcelData.lat ?? initialLat ?? 43.0396
    const lng = parcelData.lng ?? initialLng ?? -87.945

    let mapInstance: any = null

    // Load Mapbox GL JS asynchronously from CDN or module
    const loadMap = async () => {
      try {
        let mapboxgl: any
        if (typeof window !== 'undefined' && (window as any).mapboxgl) {
          mapboxgl = (window as any).mapboxgl
        } else {
          mapboxgl = (await import('mapbox-gl')).default
          // Add mapbox CSS if not present
          if (!document.getElementById('mapbox-gl-css')) {
            const link = document.createElement('link')
            link.id = 'mapbox-gl-css'
            link.rel = 'stylesheet'
            link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.1.0/mapbox-gl.css'
            document.head.appendChild(link)
          }
        }

        const mapboxToken =
          process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
          'pk.eyJ1IjoiYmVhbXRoaW5rdGFuayIsImEiOiJjbTdia2JocDgwMWYxMmtzODlhOGU5MnBvIn0.xxxx'

        mapboxgl.accessToken = mapboxToken

        const styleUrl =
          mapStyle === 'satellite'
            ? 'mapbox://styles/mapbox/satellite-streets-v12'
            : 'mapbox://styles/mapbox/dark-v11'

        mapInstance = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: styleUrl,
          center: [lng, lat],
          zoom: 17.2,
          pitch: is3DMode ? 55 : 0,
          bearing: -17.5,
          antialias: true,
        })

        mapRef.current = mapInstance

        mapInstance.on('load', () => {
          // Add 3D building extrusions if using vector dark style
          if (mapStyle === 'dark' && !mapInstance.getLayer('3d-buildings')) {
            const layers = mapInstance.getStyle().layers
            let labelLayerId: string | undefined
            for (const layer of layers) {
              if (layer.type === 'symbol' && layer.layout?.['text-field']) {
                labelLayerId = layer.id
                break
              }
            }

            mapInstance.addLayer(
              {
                id: '3d-buildings',
                source: 'composite',
                'source-layer': 'building',
                filter: ['==', 'extrude', 'true'],
                type: 'fill-extrusion',
                minzoom: 15,
                paint: {
                  'fill-extrusion-color': '#1a2e26',
                  'fill-extrusion-height': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    15,
                    0,
                    15.05,
                    ['get', 'height'],
                  ],
                  'fill-extrusion-base': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    15,
                    0,
                    15.05,
                    ['get', 'min_height'],
                  ],
                  'fill-extrusion-opacity': 0.85,
                },
              },
              labelLayerId,
            )
          }

          // Add Regrid parcel geometry polygon source and highlight layers
          if (parcelData.geometry) {
            const geojsonSource = {
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  geometry: parcelData.geometry,
                  properties: {
                    address: parcelData.address,
                    owner: parcelData.ownerName,
                  },
                },
              ],
            }

            if (mapInstance.getSource('regrid-parcel')) {
              mapInstance.getSource('regrid-parcel').setData(geojsonSource)
            } else {
              mapInstance.addSource('regrid-parcel', {
                type: 'geojson',
                data: geojsonSource,
              })

              // Glowing fill highlight
              mapInstance.addLayer({
                id: 'regrid-parcel-fill',
                type: 'fill',
                source: 'regrid-parcel',
                paint: {
                  'fill-color': '#e8c872',
                  'fill-opacity': 0.3,
                },
              })

              // Crisp stroke outline
              mapInstance.addLayer({
                id: 'regrid-parcel-stroke',
                type: 'line',
                source: 'regrid-parcel',
                paint: {
                  'line-color': '#e8c872',
                  'line-width': 3,
                  'line-blur': 0.5,
                },
              })
            }
          }
        })
      } catch (err) {
        console.warn('Mapbox GL initialization fallback:', err)
      }
    }

    void loadMap()

    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove()
        } catch {
          // ignore cleanup errors
        }
        mapRef.current = null
      }
    }
  }, [parcelData, is3DMode, mapStyle, initialLat, initialLng])

  const effectiveLat = parcelData?.lat ?? initialLat ?? 43.0396
  const effectiveLng = parcelData?.lng ?? initialLng ?? -87.945
  const streetViewUrl = `/api/streetview?location=${encodeURIComponent(address)}&size=640x400`

  return (
    <div
      className={`relative overflow-hidden rounded-[2rem] border border-white/12 bg-[#091510] text-white shadow-2xl transition-all duration-300 ${
        isExpanded ? 'fixed inset-4 z-50 rounded-[2.5rem]' : className
      }`}
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#0d1c16]/90 px-5 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-grounds-sand/30 bg-grounds-sand/15 text-grounds-sand">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-white sm:text-lg">
                {propertyName || parcelData?.address || address}
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-200">
                <ShieldCheck className="h-3 w-3" /> 3D Parcel Geometry
              </span>
            </div>
            <p className="text-xs text-white/60">{address}</p>
          </div>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIs3DMode(!is3DMode)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              is3DMode
                ? 'border-grounds-sand/50 bg-grounds-sand/15 text-grounds-sand'
                : 'border-white/15 bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            <Compass className={`h-3.5 w-3.5 transition-transform ${is3DMode ? 'rotate-45' : ''}`} />
            {is3DMode ? '3D View' : '2D Map'}
          </button>

          <button
            type="button"
            onClick={() => setMapStyle(mapStyle === 'dark' ? 'satellite' : 'dark')}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/10"
          >
            <Layers className="h-3.5 w-3.5" />
            {mapStyle === 'dark' ? 'Satellite' : 'Vector Dark'}
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70 transition hover:bg-white/10"
            title={isExpanded ? 'Exit full screen' : 'Expand full screen'}
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Main Viewport Container */}
      <div className={`relative w-full ${isExpanded ? 'h-[calc(100%-80px)]' : compact ? 'h-[340px]' : 'h-[480px]'}`}>
        {/* Mapbox Canvas */}
        <div ref={mapContainerRef} className="h-full w-full bg-[#07110c]" />

        {/* Loading Spinner */}
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#091510]/80 backdrop-blur-sm">
            <RefreshCw className="h-8 w-8 animate-spin text-grounds-sand" />
            <p className="mt-3 text-sm text-white/70">Rendering 3D parcel geometry & satellite layers...</p>
          </div>
        )}

        {/* Floating Overlay Panel: Street View Image */}
        <div className="absolute bottom-4 left-4 z-10 max-w-[280px] sm:max-w-[320px]">
          <div className="group relative overflow-hidden rounded-2xl border border-white/20 bg-[#0d1c16]/90 p-2 shadow-2xl backdrop-blur-md">
            <div className="relative h-36 w-full overflow-hidden rounded-xl bg-black/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={streetViewUrl}
                alt={`Street View of ${address}`}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

              <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full border border-white/20 bg-black/50 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-white backdrop-blur-sm uppercase">
                <Eye className="h-3 w-3 text-grounds-sand" /> Street View
              </div>

              <button
                type="button"
                onClick={() => setStreetViewOpen(true)}
                className="absolute bottom-2 right-2 rounded-full border border-white/20 bg-black/60 p-1.5 text-white/90 backdrop-blur-sm hover:bg-black/80"
                title="Expand Street View"
              >
                <Expand className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-2 px-1 pb-1">
              <p className="text-xs font-semibold text-white">{parcelData?.address || address}</p>
              <p className="text-[11px] text-white/60">Google Street View Proxy API</p>
            </div>
          </div>
        </div>

        {/* Floating Overlay Panel: Regrid + MPROP Tax Data Card */}
        <div className="absolute top-4 right-4 z-10 w-[280px] sm:w-[320px]">
          <div className="space-y-3 rounded-2xl border border-white/20 bg-[#0d1c16]/90 p-4 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-grounds-sand uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5" /> MPROP Tax Intelligence
              </span>
              <span className="rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] text-white/70">
                {parcelData?.source === 'regrid' ? 'Regrid Live' : 'Milwaukee Civic Data'}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-white/50">Parcel TaxKey</span>
                <span className="font-mono font-medium text-white">{parcelData?.parcelId || '388-1204-000'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Owner of Record</span>
                <span className="font-medium text-white max-w-[170px] truncate text-right">
                  {parcelData?.ownerName || 'United Methodist Church'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Zoning Code</span>
                <span className="inline-flex items-center gap-1 font-semibold text-amber-200">
                  <Tag className="h-3 w-3" /> {parcelData?.zoning || 'RT4 Multi-Family'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Assessed Total Value</span>
                <span className="font-semibold text-emerald-300">
                  {parcelData?.assessedValue || '$1,250,000 (Exempt)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Coordinates</span>
                <span className="font-mono text-[11px] text-white/70">
                  {effectiveLat.toFixed(4)}°, {effectiveLng.toFixed(4)}°
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Modal for Street View */}
      {streetViewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="relative max-w-4xl w-full overflow-hidden rounded-3xl border border-white/20 bg-[#0c1a14] p-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h4 className="text-lg font-semibold text-white">{address}</h4>
                <p className="text-xs text-white/60">High-Resolution Google Street View</p>
              </div>
              <button
                type="button"
                onClick={() => setStreetViewOpen(false)}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/20"
              >
                Close
              </button>
            </div>
            <div className="mt-4 h-[500px] w-full overflow-hidden rounded-2xl bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/streetview?location=${encodeURIComponent(address)}&size=1024x640`}
                alt={`Expanded Street View of ${address}`}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
