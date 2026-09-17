'use client'

import { useState } from 'react'
import {
  X,
  History,
  Search,
  Share2,
  Trash2,
  ExternalLink,
  MapPin,
  Clock,
  CheckCircle2,
} from 'lucide-react'
import type { SearchHistoryItem } from '@/components/profile/EditProfileModal'

interface SearchHistoryDrawerProps {
  isOpen: boolean
  searchHistory: SearchHistoryItem[]
  onClose: () => void
  onReinspect: (item: SearchHistoryItem) => void
  onClearHistory: () => void
  onDeleteItem: (id: string) => void
}

export function SearchHistoryDrawer({
  isOpen,
  searchHistory,
  onClose,
  onReinspect,
  onClearHistory,
  onDeleteItem,
}: SearchHistoryDrawerProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  if (!isOpen) return null

  function handleShareLink(item: SearchHistoryItem) {
    if (typeof window === 'undefined') return
    const baseUrl = `${window.location.origin}${window.location.pathname}`
    let param = `address=${encodeURIComponent(item.address || item.query)}`
    if (item.taxkey) {
      param = `taxkey=${encodeURIComponent(item.taxkey)}`
    } else if (item.lat && item.lng) {
      param = `lat=${item.lat}&lng=${item.lng}`
    }
    const shareUrl = `${baseUrl}?${param}`

    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedId(item.id)
      setTimeout(() => setCopiedId(null), 2500)
    })
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm flex justify-end">
      {/* Slide-out Drawer Panel */}
      <div className="relative w-full max-w-md h-full bg-[#0b1712] border-l border-[rgba(237,243,234,0.14)] text-[#edf3ea] p-6 flex flex-col shadow-2xl space-y-6">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-[rgba(237,243,234,0.1)] pb-4">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-[#c8b97a]" />
            <h2 className="font-serif text-lg font-medium text-[#edf3ea]">
              Inspected Sites &amp; Search History
            </h2>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="rounded-full p-2 text-[rgba(237,243,234,0.6)] hover:bg-[#102119] hover:text-white transition"
            title="Close History Drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Action Header: Clear All */}
        {searchHistory.length > 0 && (
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[rgba(237,243,234,0.6)]">
              {searchHistory.length} site{searchHistory.length === 1 ? '' : 's'} inspected
            </span>

            <button
              onClick={onClearHistory}
              type="button"
              className="text-rose-400 hover:text-rose-300 transition underline flex items-center gap-1"
            >
              <Trash2 className="h-3 w-3" /> Clear All History
            </button>
          </div>
        )}

        {/* History Item List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {searchHistory.length === 0 ? (
            <div className="rounded-2xl border border-[rgba(237,243,234,0.1)] bg-white/[0.02] p-8 text-center space-y-2">
              <Clock className="h-8 w-8 text-[#c8b97a]/50 mx-auto" />
              <p className="text-sm font-semibold text-[#edf3ea]">No Search History Yet</p>
              <p className="text-xs text-[rgba(237,243,234,0.6)]">
                Any address searches, pin drops, or photo inspections will be logged here for quick access.
              </p>
            </div>
          ) : (
            searchHistory.map((item) => (
              <div
                key={item.id}
                className="group rounded-2xl border border-[rgba(237,243,234,0.12)] bg-white/[0.03] p-4 space-y-3 hover:border-[#88aa8f]/40 hover:bg-white/[0.05] transition shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 font-bold text-sm text-[#edf3ea]">
                      <MapPin className="h-4 w-4 text-[#88aa8f] shrink-0" />
                      <span className="truncate max-w-[220px]">{item.address || item.query}</span>
                    </div>
                    {item.taxkey && (
                      <p className="text-[10px] font-mono text-[#c8b97a]">TaxKey: {item.taxkey}</p>
                    )}
                    <p className="text-[10px] font-mono text-[rgba(237,243,234,0.5)]">
                      Inspected: {new Date(item.timestamp).toLocaleString()}
                    </p>
                  </div>

                  <span className="rounded-full bg-[#102119] border border-[#88aa8f]/30 px-2 py-0.5 text-[9px] font-mono text-[#c8b97a] uppercase font-bold">
                    {item.mode === 'map' ? 'Map Pin' : 'Address'}
                  </span>
                </div>

                {/* Card Action Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-[rgba(237,243,234,0.08)]">
                  <button
                    onClick={() => {
                      onReinspect(item)
                      onClose()
                    }}
                    type="button"
                    className="inline-flex items-center gap-1 rounded-full bg-[#88aa8f]/20 border border-[#88aa8f]/40 px-3 py-1 text-xs font-semibold text-[#edf3ea] hover:bg-[#88aa8f] hover:text-[#07100c] transition"
                  >
                    <Search className="h-3 w-3" /> Re-inspect Site
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleShareLink(item)}
                      type="button"
                      className="inline-flex items-center gap-1 rounded-full border border-[rgba(237,243,234,0.15)] bg-white/[0.02] px-2.5 py-1 text-xs font-medium text-[#c8b97a] hover:bg-white/[0.08] hover:text-white transition"
                      title="Copy Shareable Deep-Link URL"
                    >
                      {copiedId === item.id ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                          <span className="text-emerald-300 font-mono text-[10px]">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="h-3 w-3" />
                          <span>Share Link</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => onDeleteItem(item.id)}
                      type="button"
                      className="rounded-full p-1.5 text-[rgba(237,243,234,0.4)] hover:text-rose-400 hover:bg-rose-950/40 transition"
                      title="Delete Entry"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
