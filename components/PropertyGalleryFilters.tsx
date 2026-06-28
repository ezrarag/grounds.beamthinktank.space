'use client'

import { cityLabel } from '@/lib/cities'
import { cn } from '@/lib/utils'

interface PropertyGalleryFiltersProps {
  nodes: string[]
  classes: string[]
  activeNode: string
  activeClass: string
  onNodeChange: (value: string) => void
  onClassChange: (value: string) => void
}

function labelFor(value: string) {
  if (value === 'all') return 'All'
  return value.replace(/-/g, ' ')
}

function FilterRow({
  label,
  options,
  active,
  onChange,
  format = labelFor,
}: {
  label: string
  options: string[]
  active: string
  onChange: (value: string) => void
  format?: (value: string) => string
}) {
  return (
    <div>
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">{label}</p>
      <div className="-mx-1 mt-2 flex gap-2 overflow-x-auto pb-1">
        {['all', ...options].map((option) => {
          const isActive = option === active
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              aria-pressed={isActive}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1 text-xs capitalize transition',
                isActive
                  ? 'border-[#88aa8f]/70 bg-[#88aa8f]/15 text-[#88aa8f]'
                  : 'border-white/15 text-white/60 hover:border-white/30 hover:text-white/80',
              )}
            >
              {option === 'all' ? 'All' : format(option)}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function PropertyGalleryFilters({
  nodes,
  classes,
  activeNode,
  activeClass,
  onNodeChange,
  onClassChange,
}: PropertyGalleryFiltersProps) {
  return (
    <div className="space-y-3 rounded-[16px] border border-white/10 bg-white/[0.03] p-4">
      <FilterRow label="Node" options={nodes} active={activeNode} onChange={onNodeChange} format={cityLabel} />
      <FilterRow label="Class" options={classes} active={activeClass} onChange={onClassChange} />
    </div>
  )
}
