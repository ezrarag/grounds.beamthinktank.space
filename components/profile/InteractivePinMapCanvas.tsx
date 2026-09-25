'use client'

import { useEffect, useRef, useState } from 'react'
import {
  MapPin,
  Compass,
  Search,
  ExternalLink,
  Sparkles,
  Layers,
  Plus,
  Minus,
  Locate,
  RotateCcw,
  Navigation,
} from 'lucide-react'
import type { BeamAsset } from '@/lib/useAcquisitionSites'

export type PropertyDispositionFilter = 'all' | 'vacant' | 'foreclosed' | 'commercial' | 'for_sale'

interface InteractivePinMapCanvasProps {
  center: { lat: number; lng: number }
  onCoordsChange: (coords: { lat: number; lng: number }, autoInspect?: boolean) => void
  onInspectParcel: (coords: { lat: number; lng: number }) => void
  liveAssets?: BeamAsset[]
  fullBleedMobile?: boolean
}

// Generate a GeoJSON circle polygon for 0.5-mile radius (approx 804.67 meters)
function createGeoJSONCircle(center: [number, number], radiusInKm: number = 0.804672, points: number = 64) {
  const coords = {
    latitude: center[1],
    longitude: center[0],
  }

  const km = radiusInKm
  const ret: [number, number][] = []
  const distanceX = km / (111.32 * Math.cos((coords.latitude * Math.PI) / 180))
  const distanceY = km / 110.574

  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI)
    const x = distanceX * Math.cos(theta)
    const y = distanceY * Math.sin(theta)
    ret.push([coords.longitude + x, coords.latitude + y])
  }
  ret.push(ret[0])

  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [ret],
    },
    properties: {},
  }
}

export function InteractivePinMapCanvas({
  center,
  onCoordsChange,
  onInspectParcel,
  liveAssets = [],
  fullBleedMobile = true,
}: InteractivePinMapCanvasProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapboxError, setMapboxError] = useState(false)
  const [currentZoom, setCurrentZoom] = useState(15.5)
  const [mapStyle, setMapStyle] = useState<'satellite' | 'dark'>('satellite')
  const [locatingUser, setLocatingUser] = useState(false)

  const [dispositionFilter, setDispositionFilter] = useState<PropertyDispositionFilter>('all')
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>(center)

  // Synchronize map & marker position whenever `center` prop changes (from Geolocation or Search)
  useEffect(() => {
    if (!center || typeof center.lat !== 'number' || typeof center.lng !== 'number') return
    setCurrentCoords(center)

    if (mapInstanceRef.current && mapLoaded) {
      const map = mapInstanceRef.current
      const marker = markerRef.current

      map.flyTo({
        center: [center.lng, center.lat],
        zoom: Math.max(map.getZoom() || 15.5, 15.5),
        essential: true,
        duration: 1200,
      })

      if (marker) {
        marker.setLngLat([center.lng, center.lat])
      }

      const source = map.getSource('radius-circle-source')
      if (source) {
        const newCircleData = createGeoJSONCircle([center.lng, center.lat])
        ;(source as any).setData(newCircleData)
      }
    }
  }, [center.lat, center.lng, mapLoaded])

  // Initialize Mapbox GL JS map canvas
  useEffect(() => {
    if (!mapContainerRef.current) return
    let isMounted = true

    const initMapbox = async () => {
      try {
        let mapboxgl: any
        if (typeof window !== 'undefined' && (window as any).mapboxgl) {
          mapboxgl = (window as any).mapboxgl
        } else {
          mapboxgl = (await import('mapbox-gl')).default
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

        const map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: styleUrl,
          center: [currentCoords.lng, currentCoords.lat],
          zoom: 15.5,
          pitch: 35,
          bearing: -10,
          antialias: true,
        })

        mapInstanceRef.current = map

        // Add Mapbox Native Navigation Controls (Zoom In/Out + Compass)
        const navControl = new mapboxgl.NavigationControl({
          visualizePitch: true,
          showCompass: true,
          showZoom: true,
        })
        map.addControl(navControl, 'top-right')

        // Add Mapbox Geolocation Control
        const geolocateControl = new mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
          showUserHeading: true,
        })
        map.addControl(geolocateControl, 'top-right')

        geolocateControl.on('geolocate', (e: any) => {
          if (!isMounted) return
          const uLat = e.coords.latitude
          const uLng = e.coords.longitude
          const newCoords = { lat: uLat, lng: uLng }
          setCurrentCoords(newCoords)
          if (markerRef.current) markerRef.current.setLngLat([uLng, uLat])
          onCoordsChange(newCoords, true)
        })

        map.on('zoom', () => {
          if (isMounted) setCurrentZoom(map.getZoom())
        })

        map.on('load', () => {
          if (!isMounted) return
          setMapLoaded(true)

          // 1. Add 0.5-Mile Radius Circle Source & Layers
          const circleGeoJSON = createGeoJSONCircle([currentCoords.lng, currentCoords.lat])
          map.addSource('radius-circle-source', {
            type: 'geojson',
            data: circleGeoJSON as any,
          })

          map.addLayer({
            id: 'radius-circle-fill',
            type: 'fill',
            source: 'radius-circle-source',
            paint: {
              'fill-color': '#88aa8f',
              'fill-opacity': 0.18,
            },
          })

          map.addLayer({
            id: 'radius-circle-outline',
            type: 'line',
            source: 'radius-circle-source',
            paint: {
              'line-color': '#c8b97a',
              'line-width': 2,
              'line-dasharray': [3, 2],
            },
          })

          // 2. Create Primary Draggable BEAM Target Pin Marker
          const markerEl = document.createElement('div')
          markerEl.className = 'group cursor-grab active:cursor-grabbing flex flex-col items-center'
          markerEl.innerHTML = `
            <div class="flex h-9 w-9 items-center justify-center rounded-full bg-amber-400 p-1 text-black shadow-2xl border-2 border-white animate-bounce">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
            <span class="mt-1 rounded-md bg-black/90 px-2 py-0.5 font-mono text-[9px] font-bold text-amber-300 border border-amber-400/60 shadow-lg">BEAM Target Pin (Drag Me)</span>
          `

          const marker = new mapboxgl.Marker({
            element: markerEl,
            draggable: true,
          })
            .setLngLat([currentCoords.lng, currentCoords.lat])
            .addTo(map)

          markerRef.current = marker

          // 3. Listen for Marker Dragend Event
          marker.on('dragend', () => {
            const lngLat = marker.getLngLat()
            const newCoords = { lat: lngLat.lat, lng: lngLat.lng }
            setCurrentCoords(newCoords)

            // Update 0.5-Mile Radius Circle position
            const newCircleData = createGeoJSONCircle([lngLat.lng, lngLat.lat])
            const source = map.getSource('radius-circle-source')
            if (source) (source as any).setData(newCircleData)

            onCoordsChange(newCoords, true)
          })

          // 4. Listen for Map Surface Click Event
          map.on('click', (e: any) => {
            try {
              const clickedLat = e.lngLat.lat
              const clickedLng = e.lngLat.lng
              const newCoords = { lat: clickedLat, lng: clickedLng }

              setCurrentCoords(newCoords)
              marker.setLngLat([clickedLng, clickedLat])

              // Update 0.5-Mile Radius Circle position
              const newCircleData = createGeoJSONCircle([clickedLng, clickedLat])
              const source = map.getSource('radius-circle-source')
              if (source) (source as any).setData(newCircleData)

              onCoordsChange(newCoords, true)
            } catch (err) {
              console.warn('Map click notice:', err)
            }
          })

          // 5. Add Markers for Real BEAM Acquisition Sites in Database
          liveAssets.forEach((asset) => {
            if (asset.address) {
              const assetEl = document.createElement('div')
              assetEl.className = 'cursor-pointer flex flex-col items-center opacity-85 hover:opacity-100 transition'
              assetEl.innerHTML = `
                <div class="flex h-7 w-7 items-center justify-center rounded-full bg-[#102119] p-1 text-[#88aa8f] border border-[#88aa8f]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 22V12a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v10"/><path d="M18 22V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v18"/></svg>
                </div>
                <span class="rounded bg-black/80 px-1.5 py-0.5 text-[8px] font-mono font-bold text-[#c8b97a]">${asset.name}</span>
              `
              assetEl.addEventListener('click', (e) => {
                try {
                  e.stopPropagation()
                  onInspectParcel({ lat: currentCoords.lat, lng: currentCoords.lng })
                } catch (err) {
                  console.warn('Pin inspect notice:', err)
                }
              })

              const approxHash = asset.name.length % 5
              const approxLat = currentCoords.lat + (approxHash - 2) * 0.003
              const approxLng = currentCoords.lng + (approxHash - 2) * 0.003

              new mapboxgl.Marker({ element: assetEl })
                .setLngLat([approxLng, approxLat])
                .addTo(map)
            }
          })
        })
      } catch (err) {
        console.warn('Mapbox GL initialization fallback:', err)
        setMapboxError(true)
      }
    }

    void initMapbox()

    return () => {
      isMounted = false
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
      }
    }
  }, [])

  // Handle Zoom In Action
  function handleZoomIn() {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn()
    }
  }

  // Handle Zoom Out Action
  function handleZoomOut() {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut()
    }
  }

  // Handle Set Zoom Level Preset
  function handleSetZoomLevel(zoom: number) {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({ zoom, duration: 800 })
    }
  }

  // Handle Go to User Physical Location via Geolocation API
  function handleFlyToUserLocation() {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      alert('Geolocation is not supported by your browser.')
      return
    }

    setLocatingUser(true)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const uLat = pos.coords.latitude
        const uLng = pos.coords.longitude
        const newCoords = { lat: uLat, lng: uLng }

        setCurrentCoords(newCoords)
        setLocatingUser(false)

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo({
            center: [uLng, uLat],
            zoom: 16.5,
            pitch: 35,
            duration: 1500,
            essential: true,
          })
        }

        if (markerRef.current) {
          markerRef.current.setLngLat([uLng, uLat])
        }

        if (mapInstanceRef.current) {
          const source = mapInstanceRef.current.getSource('radius-circle-source')
          if (source) {
            const newCircleData = createGeoJSONCircle([uLng, uLat])
            ;(source as any).setData(newCircleData)
          }
        }

        onCoordsChange(newCoords, true)
      },
      (err) => {
        setLocatingUser(false)
        alert(`Unable to retrieve your location: ${err.message || 'Location permission denied.'}`)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // Handle Map Style Switcher (Satellite vs Dark)
  function handleToggleMapStyle() {
    const nextStyle = mapStyle === 'satellite' ? 'dark' : 'satellite'
    setMapStyle(nextStyle)
    if (mapInstanceRef.current) {
      const styleUrl =
        nextStyle === 'satellite'
          ? 'mapbox://styles/mapbox/satellite-streets-v12'
          : 'mapbox://styles/mapbox/dark-v11'
      mapInstanceRef.current.setStyle(styleUrl)
    }
  }

  // Reset Pitch & Bearing to North
  function handleResetBearing() {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({ bearing: 0, pitch: 0, duration: 800 })
    }
  }

  return (
    <div className={`relative w-full ${fullBleedMobile ? 'fixed inset-0 h-[100dvh] w-screen z-0 md:relative md:h-auto md:w-full md:z-auto' : 'space-y-4'}`}>
      {/* Layer 1: Top Floating Controls Island */}
      <div className="fixed top-4 left-3 right-3 z-20 md:static md:w-full rounded-2xl border border-[rgba(237,243,234,0.18)] bg-[#091510]/90 p-3 space-y-2.5 text-left backdrop-blur-md shadow-2xl">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <MapPin className="h-4 w-4 text-amber-400 shrink-0" />
            <span className="font-mono text-xs font-bold text-[#edf3ea] truncate">
              {currentCoords.lat.toFixed(4)}° N, {currentCoords.lng.toFixed(4)}° W
            </span>
            <span className="hidden sm:inline-block rounded-full bg-amber-400/20 border border-amber-400/40 px-2 py-0.5 font-mono text-[9px] font-bold text-amber-300 shrink-0">
              Draggable Pin Active
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleFlyToUserLocation}
              disabled={locatingUser}
              type="button"
              className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1 font-mono text-xs font-bold text-black hover:bg-amber-300 transition shadow-md disabled:opacity-50"
              title="Fly map directly to your current device location"
            >
              <Locate className={`h-3.5 w-3.5 text-black ${locatingUser ? 'animate-spin' : ''}`} />
              <span>{locatingUser ? 'Locating...' : 'Locate Me'}</span>
            </button>
          </div>
        </div>

        {/* Property Disposition Chips (Horizontally Swipeable on Mobile) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-1 border-t border-[rgba(237,243,234,0.1)] font-mono text-[10px] no-scrollbar">
          <span className="text-white/40 uppercase font-bold text-[9px] shrink-0 mr-0.5">Dispositions:</span>
          <button
            onClick={() => setDispositionFilter('all')}
            type="button"
            className={`rounded-full px-2.5 py-0.5 transition font-bold shrink-0 ${
              dispositionFilter === 'all'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            🌐 All
          </button>
          <button
            onClick={() => setDispositionFilter('vacant')}
            type="button"
            className={`rounded-full px-2.5 py-0.5 transition font-bold shrink-0 ${
              dispositionFilter === 'vacant'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            🌾 Vacant Lots
          </button>
          <button
            onClick={() => setDispositionFilter('foreclosed')}
            type="button"
            className={`rounded-full px-2.5 py-0.5 transition font-bold shrink-0 ${
              dispositionFilter === 'foreclosed'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            ⚠️ Tax Lien
          </button>
          <button
            onClick={() => setDispositionFilter('commercial')}
            type="button"
            className={`rounded-full px-2.5 py-0.5 transition font-bold shrink-0 ${
              dispositionFilter === 'commercial'
                ? 'bg-sky-400 text-slate-950 shadow-sm'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            🏢 Commercial Core
          </button>
          <button
            onClick={() => setDispositionFilter('for_sale')}
            type="button"
            className={`rounded-full px-2.5 py-0.5 transition font-bold shrink-0 ${
              dispositionFilter === 'for_sale'
                ? 'bg-purple-400 text-slate-950 shadow-sm'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            🏷️ For-Sale Assets
          </button>
        </div>
      </div>

      {/* Layer 2: Right-Rail Floating Action Buttons */}
      <div className="fixed right-3 top-28 z-20 flex flex-col gap-2 md:absolute md:top-auto md:bottom-4 md:right-4">
        <button
          onClick={handleFlyToUserLocation}
          disabled={locatingUser}
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-400/60 bg-[#091510]/90 text-amber-300 shadow-2xl backdrop-blur-md hover:bg-amber-400/20 transition disabled:opacity-50"
          title="Center on current device GPS location"
        >
          <Locate className={`h-4 w-4 ${locatingUser ? 'animate-spin' : ''}`} />
        </button>

        <button
          onClick={handleToggleMapStyle}
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-[#091510]/90 text-white shadow-2xl backdrop-blur-md hover:bg-white/20 transition"
          title="Toggle Satellite vs Dark Vector Map"
        >
          <Layers className="h-4 w-4 text-emerald-400" />
        </button>

        <button
          onClick={handleResetBearing}
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-[#091510]/90 text-white/80 shadow-2xl backdrop-blur-md hover:bg-white/20 transition"
          title="Reset North & Pitch"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        <div className="flex flex-col rounded-full border border-white/20 bg-[#091510]/90 p-1 shadow-2xl backdrop-blur-md">
          <button
            onClick={handleZoomIn}
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full text-white hover:bg-white/20 transition"
            title="Zoom In"
          >
            <Plus className="h-4 w-4" />
          </button>
          <div className="h-px bg-white/15 w-full my-0.5" />
          <button
            onClick={handleZoomOut}
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full text-white hover:bg-white/20 transition"
            title="Zoom Out"
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Interactive Map Canvas Element */}
      <div className={`relative w-full ${fullBleedMobile ? 'h-[100dvh] md:h-[480px] md:mt-3 md:rounded-3xl md:border md:border-[rgba(237,243,234,0.18)] md:shadow-2xl' : 'h-[440px] rounded-3xl border border-[rgba(237,243,234,0.18)] shadow-2xl'} overflow-hidden bg-[#07100c]`}>
        {!mapboxError ? (
          <div ref={mapContainerRef} className="w-full h-full" />
        ) : (
          <iframe
            title="Embedded Google Maps Fallback"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            src={`https://maps.google.com/maps?q=${currentCoords.lat},${currentCoords.lng}&z=16&output=embed`}
            className="w-full h-full grayscale-[20%]"
          />
        )}
      </div>
    </div>
  )
}

