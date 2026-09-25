'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  MapPin,
  Search,
  Camera,
  ChevronUp,
  ChevronDown,
  History,
  Building2,
  Sparkles,
  ExternalLink,
  Layers,
  HardHat,
  X,
  Compass,
} from 'lucide-react'
import type { PropertyDispositionFilter } from '@/components/profile/InteractivePinMapCanvas'
import type { ParcelResult } from '@/app/api/parcel/route'

export type SheetSnapState = 'peek' | 'half' | 'full'

interface MobileMapBottomSheetProps {
  currentCoords: { lat: number; lng: number }
  activeAddress?: string | null
  inspectedParcel?: ParcelResult | null
  dispositionFilter: PropertyDispositionFilter
  onFilterChange: (filter: PropertyDispositionFilter) => void
  onInspectCurrentCoords: () => void
  onSearchAddress?: (query: string) => void
  onTakePhoto?: () => void
  onOpenHistory?: () => void
  onOpenTestimony?: () => void
  searchInputValue?: string
  onSearchInputChange?: (val: string) => void
  searchingParcel?: boolean
}

export function MobileMapBottomSheet({
  currentCoords,
  activeAddress,
  inspectedParcel,
  dispositionFilter,
  onFilterChange,
  onInspectCurrentCoords,
  onSearchAddress,
  onTakePhoto,
  onOpenHistory,
  onOpenTestimony,
  searchInputValue = '',
  onSearchInputChange,
  searchingParcel = false,
}: MobileMapBottomSheetProps) {
  const [snapState, setSnapState] = useState<SheetSnapState>('half')
  const [dragStartY, setDragStartY] = useState<number | null>(null)
  const [currentYOffset, setCurrentYOffset] = useState<number>(0)
  const [localSearchQuery, setLocalSearchQuery] = useState(searchInputValue)

  useEffect(() => {
    setLocalSearchQuery(searchInputValue)
  }, [searchInputValue])

  // Drag Gesture Handlers for Touch Devices
  const handleTouchStart = (e: React.TouchEvent) => {
    setDragStartY(e.touches[0].clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStartY === null) return
    const deltaY = e.touches[0].clientY - dragStartY
    setCurrentYOffset(deltaY)
  }

  const handleTouchEnd = () => {
    if (dragStartY === null) return
    if (currentYOffset < -50) {
      // Swiped Up
      if (snapState === 'peek') setSnapState('half')
      else if (snapState === 'half') setSnapState('full')
    } else if (currentYOffset > 50) {
      // Swiped Down
      if (snapState === 'full') setSnapState('half')
      else if (snapState === 'half') setSnapState('peek')
    }
    setDragStartY(null)
    setCurrentYOffset(0)
  }

  // Snap height styling mapping
  const snapHeights: Record<SheetSnapState, string> = {
    peek: 'h-[110px]',
    half: 'h-[440px]',
    full: 'h-[88vh]',
  }

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-30 transition-all duration-300 ease-in-out md:hidden ${snapHeights[snapState]} rounded-t-[28px] border-t border-[rgba(237,243,234,0.2)] bg-[#091510]/95 backdrop-blur-xl shadow-[0_-10px_40px_rgba(0,0,0,0.8)] text-[#edf3ea] flex flex-col overflow-hidden`}
      style={{
        transform: currentYOffset ? `translateY(${Math.max(-80, Math.min(80, currentYOffset))}px)` : 'none',
      }}
    >
      {/* Drag Handle Bar */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => {
          if (snapState === 'peek') setSnapState('half')
          else if (snapState === 'half') setSnapState('full')
          else setSnapState('peek')
        }}
        className="cursor-grab active:cursor-grabbing flex flex-col items-center justify-center pt-3 pb-2 px-4 shrink-0 hover:bg-white/[0.03] transition"
      >
        <div className="h-1.5 w-12 rounded-full bg-amber-400/60 shadow-sm" />
        <div className="w-full flex items-center justify-between mt-2 font-mono text-[10px] text-amber-300 font-bold uppercase tracking-wider">
          <span className="flex items-center gap-1">
            <Compass className="h-3 w-3 text-amber-400" />
            {snapState === 'peek' ? 'Tap to Expand Sheet' : snapState === 'half' ? 'Swipe Up for Full Details' : 'Full Parcel Intelligence'}
          </span>
          <div className="flex items-center gap-1 text-[9px] text-[rgba(237,243,234,0.6)]">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setSnapState('peek')
              }}
              className={`px-1.5 py-0.5 rounded ${snapState === 'peek' ? 'bg-amber-400 text-black font-bold' : 'hover:bg-white/10'}`}
            >
              Peek
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setSnapState('half')
              }}
              className={`px-1.5 py-0.5 rounded ${snapState === 'half' ? 'bg-amber-400 text-black font-bold' : 'hover:bg-white/10'}`}
            >
              Half
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setSnapState('full')
              }}
              className={`px-1.5 py-0.5 rounded ${snapState === 'full' ? 'bg-amber-400 text-black font-bold' : 'hover:bg-white/10'}`}
            >
              Full
            </button>
          </div>
        </div>
      </div>

      {/* Peek State Header (Always visible in all snap states) */}
      <div className="px-4 py-1.5 border-b border-[rgba(237,243,234,0.08)] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 overflow-hidden pr-2">
          <MapPin className="h-4 w-4 text-amber-400 shrink-0" />
          <div className="truncate">
            <span className="font-mono text-xs font-bold text-[#edf3ea] truncate block">
              {activeAddress || `GPS Target: ${currentCoords.lat.toFixed(4)}° N, ${currentCoords.lng.toFixed(4)}° W`}
            </span>
            <span className="text-[10px] text-[#88aa8f] font-mono block truncate">
              {inspectedParcel?.zoning_description || inspectedParcel?.zoning || '0.5-Mile Radius Active Node • Socrata / Regrid'}
            </span>
          </div>
        </div>

        <button
          onClick={onInspectCurrentCoords}
          type="button"
          disabled={searchingParcel}
          className="shrink-0 rounded-full bg-amber-400 px-3 py-1.5 font-mono text-[11px] font-bold text-black hover:bg-amber-300 transition shadow-lg disabled:opacity-50"
        >
          {searchingParcel ? 'Searching...' : '⚡ Inspect Parcel'}
        </button>
      </div>

      {/* Scrollable Sheet Content Body (Visible in Half & Full Snap States) */}
      {snapState !== 'peek' && (
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 text-left">
          {/* Quick Address Search Input Bar */}
          {onSearchAddress && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (localSearchQuery.trim()) {
                  onSearchAddress(localSearchQuery.trim())
                }
              }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-amber-400/80" />
                <input
                  type="text"
                  value={localSearchQuery}
                  onChange={(e) => {
                    setLocalSearchQuery(e.target.value)
                    if (onSearchInputChange) onSearchInputChange(e.target.value)
                  }}
                  placeholder="Search street address or city node..."
                  className="w-full rounded-full border border-white/15 bg-white/[0.06] pl-8 pr-3 py-1.5 text-xs text-[#edf3ea] placeholder:text-white/40 focus:border-amber-400 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="rounded-full bg-[#88aa8f] px-3.5 py-1.5 font-mono text-xs font-bold text-[#07100c] hover:bg-[#77997e] transition shrink-0"
              >
                Search
              </button>
            </form>
          )}

          {/* Disposition Category Filter Chips */}
          <div className="space-y-1.5">
            <span className="font-mono text-[9px] uppercase font-bold text-white/50 tracking-wider">
              Filter Parcel Dispositions:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar font-mono text-[10px]">
              <button
                onClick={() => onFilterChange('all')}
                type="button"
                className={`rounded-full px-3 py-1 font-bold whitespace-nowrap transition ${
                  dispositionFilter === 'all' ? 'bg-emerald-400 text-black shadow-sm' : 'bg-white/10 text-slate-300'
                }`}
              >
                🌐 All Records
              </button>
              <button
                onClick={() => onFilterChange('vacant')}
                type="button"
                className={`rounded-full px-3 py-1 font-bold whitespace-nowrap transition ${
                  dispositionFilter === 'vacant' ? 'bg-amber-400 text-black shadow-sm' : 'bg-white/10 text-slate-300'
                }`}
              >
                🌾 Vacant &amp; Land Bank
              </button>
              <button
                onClick={() => onFilterChange('foreclosed')}
                type="button"
                className={`rounded-full px-3 py-1 font-bold whitespace-nowrap transition ${
                  dispositionFilter === 'foreclosed' ? 'bg-rose-500 text-white shadow-sm' : 'bg-white/10 text-slate-300'
                }`}
              >
                ⚠️ Tax Lien / In-Rem
              </button>
              <button
                onClick={() => onFilterChange('commercial')}
                type="button"
                className={`rounded-full px-3 py-1 font-bold whitespace-nowrap transition ${
                  dispositionFilter === 'commercial' ? 'bg-sky-400 text-black shadow-sm' : 'bg-white/10 text-slate-300'
                }`}
              >
                🏢 Commercial Core
              </button>
              <button
                onClick={() => onFilterChange('for_sale')}
                type="button"
                className={`rounded-full px-3 py-1 font-bold whitespace-nowrap transition ${
                  dispositionFilter === 'for_sale' ? 'bg-purple-400 text-black shadow-sm' : 'bg-white/10 text-slate-300'
                }`}
              >
                🏷️ For-Sale Assets
              </button>
            </div>
          </div>

          {/* Quick Action Button Grid */}
          <div className="grid grid-cols-2 gap-2 font-mono text-xs">
            {onTakePhoto && (
              <button
                onClick={onTakePhoto}
                type="button"
                className="flex items-center justify-center gap-1.5 rounded-2xl border border-amber-400/40 bg-amber-400/10 p-2.5 font-bold text-amber-300 hover:bg-amber-400/20 transition"
              >
                <Camera className="h-3.5 w-3.5 text-amber-400" />
                <span>Camera EXIF</span>
              </button>
            )}

            {onOpenHistory && (
              <button
                onClick={onOpenHistory}
                type="button"
                className="flex items-center justify-center gap-1.5 rounded-2xl border border-[#88aa8f]/40 bg-[#88aa8f]/10 p-2.5 font-bold text-[#c8b97a] hover:bg-[#88aa8f]/20 transition"
              >
                <History className="h-3.5 w-3.5 text-[#c8b97a]" />
                <span>Search History</span>
              </button>
            )}

            {onOpenTestimony && (
              <button
                onClick={onOpenTestimony}
                type="button"
                className="col-span-2 flex items-center justify-center gap-1.5 rounded-2xl border border-purple-400/40 bg-purple-500/10 p-2.5 font-bold text-purple-300 hover:bg-purple-500/20 transition"
              >
                <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                <span>Submit Space Needs &amp; Cultural Testimony</span>
              </button>
            )}
          </div>

          {/* Inspected Parcel Detailed Card (When Available or Expanded) */}
          {inspectedParcel ? (
            <div className="rounded-2xl border border-amber-400/30 bg-[#102119] p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] uppercase font-bold text-amber-400 tracking-wider">
                  Inspected Parcel Data
                </span>
                <span className="rounded bg-amber-400/20 px-2 py-0.5 font-mono text-[9px] text-amber-300">
                  {inspectedParcel.parcelId || 'City Record'}
                </span>
              </div>

              <div className="font-bold text-[#edf3ea] text-sm">
                {inspectedParcel.address || 'Target Location'}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-white/70 pt-1 border-t border-white/10">
                <div>
                  <span className="text-white/40 block">Assessed Value:</span>
                  <span className="text-emerald-300 font-bold">
                    {inspectedParcel.assessedValue ? `$${Number(inspectedParcel.assessedValue.replace(/[^0-9.]/g, '')).toLocaleString() || inspectedParcel.assessedValue}` : '$0'}
                  </span>
                </div>
                <div>
                  <span className="text-white/40 block">Land Area:</span>
                  <span>{inspectedParcel.sqft_lot || 0} sq ft</span>
                </div>
                <div>
                  <span className="text-white/40 block">Zoning:</span>
                  <span>{inspectedParcel.zoning_description || inspectedParcel.zoning || 'Residential'}</span>
                </div>
                <div>
                  <span className="text-white/40 block">Owner / Holder:</span>
                  <span className="truncate block">{inspectedParcel.ownerName || 'City / Private'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-center text-xs text-white/60 space-y-1">
              <p>📍 Tap any location or pin on the interactive map canvas to inspect property records.</p>
              <p className="text-[10px] text-amber-300/80 font-mono">
                Socrata MPROP municipal tax data &amp; Regrid GIS layer synced.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
