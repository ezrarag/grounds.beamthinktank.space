'use client'

import Link from 'next/link'
import { ArrowUpRight, CheckCircle2, Clock3, HardHat, Landmark, Scale, Sparkles, Users } from 'lucide-react'
import { laborTypes, type EquitySlot, type Phase, type PhaseStatus, type RedevelopmentProjectBundle } from '@/lib/laborTypes'

const projectStatusLabels = {
  feasibility: 'Feasibility',
  'phase-1': 'Phase 1',
  active: 'Active',
  paused: 'Paused',
  complete: 'Complete',
} as const

const phaseStatusClasses: Record<PhaseStatus, string> = {
  'not-started': 'border-white/15 bg-white/6 text-white/70',
  'in-progress': 'border-grounds-sand/30 bg-grounds-sand/12 text-grounds-sand',
  complete: 'border-emerald-300/30 bg-emerald-400/14 text-emerald-100',
}

function statusBadge(status: PhaseStatus) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${phaseStatusClasses[status]}`}>
      {status.replace('-', ' ')}
    </span>
  )
}

function laborBadge(laborType: keyof typeof laborTypes) {
  const config = laborTypes[laborType]

  return (
    <span
      className="inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold"
      style={{
        backgroundColor: config.colorBg,
        borderColor: `${config.colorFg}22`,
        color: config.colorFg,
      }}
    >
      {config.label}
    </span>
  )
}

function percent(hoursCommitted: number, hoursNeeded: number) {
  if (hoursNeeded <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((hoursCommitted / hoursNeeded) * 100)))
}

function splitParagraphs(body: string) {
  return body
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}

function PhasePanel({ phase }: { phase: Phase }) {
  return (
    <article className="surface-panel p-6 shadow-grounds">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="eyebrow">Phase {phase.order}</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">{phase.title}</h3>
        </div>
        {statusBadge(phase.status)}
      </div>

      <div className="mt-6 grid gap-4">
        {phase.tasks.map((task) => (
          <div
            key={`${phase.id}-${task.title}`}
            className={`rounded-[1.35rem] border p-4 ${
              task.laborType === 'licensed'
                ? 'border-[#A23C28]/45 bg-[#A23C28]/10'
                : 'border-white/10 bg-white/[0.03]'
            }`}
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-lg font-medium text-white">{task.title}</h4>
                  {laborBadge(task.laborType)}
                  {statusBadge(task.status)}
                </div>
                {task.note ? <p className="max-w-3xl text-sm leading-7 text-white/68">{task.note}</p> : null}
              </div>

              <div className="shrink-0 rounded-2xl border border-white/10 bg-black/10 px-3 py-2 text-sm text-white/72">
                {task.estimatedHours > 0 ? `${task.estimatedHours} hrs estimated` : 'Hours funded externally'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </article>
  )
}

function EquitySlotCard({ slot }: { slot: EquitySlot }) {
  const progress = percent(slot.hoursCommitted, slot.hoursNeeded)

  return (
    <article className="surface-panel p-5 shadow-grounds">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{slot.role}</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {laborBadge(slot.laborType)}
            {!slot.isOpen ? (
              <span className="inline-flex rounded-full border border-white/12 bg-white/6 px-2.5 py-1 text-xs text-white/60">
                Closed
              </span>
            ) : null}
            {slot.requiresSupervision ? (
              <span className="inline-flex rounded-full border border-white/12 bg-white/6 px-2.5 py-1 text-xs text-white/60">
                Supervision required
              </span>
            ) : null}
          </div>
        </div>
        <Users className="mt-1 h-5 w-5 text-grounds-sand" />
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-sm text-white/62">
          <span>{slot.hoursCommitted} committed</span>
          <span>{slot.hoursNeeded} needed</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/8">
          <div className="h-full rounded-full bg-grounds-sage" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <button
        type="button"
        disabled
        title="Opening soon"
        className="mt-5 inline-flex cursor-not-allowed items-center rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm font-medium text-white/40"
      >
        Commit hours
      </button>
    </article>
  )
}

export function ProjectView({ project, phases, equitySlots }: RedevelopmentProjectBundle) {
  const visionParagraphs = splitParagraphs(project.visionBody)

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-10">
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="surface-panel p-7 shadow-grounds sm:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="eyebrow">Redevelopment Pilot</span>
            <span className="inline-flex rounded-full border border-grounds-sand/30 bg-grounds-sand/12 px-3 py-1 text-xs font-medium text-grounds-sand">
              {projectStatusLabels[project.status]}
            </span>
          </div>

          <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            {project.name}
          </h1>
          <p className="mt-4 text-lg text-white/62">{project.address}</p>
          <p className="mt-8 max-w-3xl text-base leading-8 text-white/74">{project.summary}</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm text-white/55">People committed</p>
              <p className="mt-2 text-3xl font-semibold text-white">{project.committedCount}</p>
            </div>
            <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm text-white/55">Logged hours</p>
              <p className="mt-2 text-3xl font-semibold text-white">{project.totalLoggedHours}</p>
            </div>
            <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm text-white/55">Ledger status</p>
              <p className="mt-2 text-lg font-semibold text-white">Contribution, not debt</p>
            </div>
          </div>
        </div>

        <div className="surface-panel p-4 shadow-grounds">
          {project.restorationRenderUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={project.restorationRenderUrl}
              alt={`${project.name} restoration render`}
              className="h-full min-h-[320px] w-full rounded-[1.5rem] border border-white/10 object-cover"
            />
          ) : (
            <div className="flex min-h-[320px] h-full flex-col justify-between rounded-[1.5rem] border border-dashed border-white/14 bg-white/[0.03] p-6">
              <div className="inline-flex w-fit rounded-full border border-white/12 bg-white/6 px-3 py-1 text-xs uppercase tracking-[0.24em] text-white/60">
                Render slot
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white">Restoration render</h2>
                <p className="mt-3 max-w-md text-sm leading-7 text-white/64">
                  Coming from historic-photo research. This frame stays visible until the first restoration render is published.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="mt-8 surface-panel p-7 shadow-grounds sm:p-8">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-grounds-sand" />
          <p className="eyebrow">Vision</p>
        </div>
        <p className="mt-5 max-w-4xl text-lg leading-8 text-white/78">{project.summary}</p>
        <div className="mt-6 grid gap-5">
          {visionParagraphs.map((paragraph) => (
            <p key={paragraph} className="max-w-4xl text-base leading-8 text-white/68">
              {paragraph}
            </p>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <div className="surface-panel p-7 shadow-grounds sm:p-8">
          <div className="flex items-center gap-3">
            <HardHat className="h-5 w-5 text-grounds-sand" />
            <div>
              <p className="eyebrow">Phase Plan</p>
              <h2 className="mt-2 text-3xl font-semibold text-white">What happens, and who can legally do it</h2>
            </div>
          </div>

          <div className="mt-6 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {Object.entries(laborTypes).map(([key, config]) => (
              <div key={key} className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4">
                {laborBadge(key as keyof typeof laborTypes)}
                <p className="mt-3 text-sm leading-7 text-white/68">
                  {config.ledgerEligible ? 'Ledger-eligible contribution.' : 'Not volunteer work. Paid licensed scope funded by unlocked capital.'}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-6">
          {phases.map((phase) => (
            <PhasePanel key={phase.id} phase={phase} />
          ))}
        </div>
      </section>

      <section className="mt-8">
        <div className="surface-panel p-7 shadow-grounds sm:p-8">
          <div className="flex items-center gap-3">
            <Clock3 className="h-5 w-5 text-grounds-sand" />
            <div>
              <p className="eyebrow">Sweat-Equity Slots</p>
              <h2 className="mt-2 text-3xl font-semibold text-white">Open commitments that move the project forward</h2>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {equitySlots.map((slot) => (
            <EquitySlotCard key={slot.id} slot={slot} />
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-[2rem] border border-grounds-sand/20 bg-grounds-sand/10 p-7 shadow-grounds sm:p-8">
        <div className="flex items-center gap-3">
          <Scale className="h-5 w-5 text-grounds-sand" />
          <div>
            <p className="eyebrow">Financing Strip</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">Ledger, not lender</h2>
          </div>
        </div>

        <p className="mt-5 max-w-5xl text-base leading-8 text-white/78">{project.financingNote}</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.25rem] border border-white/10 bg-black/10 p-4">
            <p className="text-sm font-semibold text-white">42 U.S.C. § 12805</p>
            <p className="mt-2 text-sm text-white/66">Sweat-equity match</p>
          </div>
          <div className="rounded-[1.25rem] border border-white/10 bg-black/10 p-4">
            <p className="text-sm font-semibold text-white">Historic tax credits + bonds</p>
            <p className="mt-2 text-sm text-white/66">MPL precedent</p>
          </div>
          <div className="rounded-[1.25rem] border border-white/10 bg-black/10 p-4">
            <p className="text-sm font-semibold text-white">CLT holds the land</p>
            <p className="mt-2 text-sm text-white/66">Contribution is recorded, not borrowed</p>
          </div>
        </div>
      </section>

      <section className="mt-8 surface-panel p-7 shadow-grounds sm:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="eyebrow">Support</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">This page is the live pilot of BEAM&apos;s redevelopment model.</h2>
            <p className="mt-3 max-w-2xl text-base leading-8 text-white/68">
              Public visibility stays attached to the work: the building, the legal labor boundaries, and the capital stack the hours unlock.
            </p>
          </div>
          <Link
            href="#"
            className="inline-flex items-center gap-2 rounded-full border border-grounds-sand/45 px-5 py-3 text-sm font-medium text-grounds-sand transition hover:border-grounds-sand hover:bg-grounds-sand/10"
          >
            Support this project
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}

