'use client'

import { type FormEvent, type KeyboardEvent, type ReactNode, useEffect, useMemo, useState } from 'react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  FlaskConical,
  Hammer,
  Landmark,
  Music2,
  Palette,
  Shapes,
} from 'lucide-react'
import { db } from '@/lib/firebase'
import {
  CONSENT_LEVELS,
  TESTIMONY_DISCIPLINES,
  facilitiesTestimonySurvey,
  type ConsentLevel,
  type SurveyField,
  type SurveySection,
  type TestimonyDiscipline,
} from '@/lib/surveys/facilitiesTestimony'
import { cn } from '@/lib/utils'

type SurveyValue = string | string[] | boolean | null
type SurveyResponses = Record<string, SurveyValue>
type SubmissionMode = 'self' | 'interview'

interface DraftMeta {
  discipline: TestimonyDiscipline
  currentSectionIndex: number
}

const sections = facilitiesTestimonySurvey.sections

const fieldClass =
  'mt-2 w-full rounded-xl border border-white/10 bg-[#12211c]/90 px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-grounds-sand/50'

const disciplineIcons: Record<string, ReactNode> = {
  music: <Music2 className="h-5 w-5" />,
  'visual-arts': <Palette className="h-5 w-5" />,
  engineering: <FlaskConical className="h-5 w-5" />,
  general: <Shapes className="h-5 w-5" />,
}

const venueSuggestions = [
  { label: 'Performance venue', icon: Music2 },
  { label: 'Studio / gallery', icon: Palette },
  { label: 'Tech / lab', icon: FlaskConical },
  { label: 'Fabrication shop', icon: Hammer },
  { label: 'Office / classroom', icon: Building2 },
]

function SpatialBackdrop({ sectionIndex }: { sectionIndex: number }) {
  const patterns = [
    <><path d="M55 205V75h190v130M95 205V118h110v87M55 104h190M150 75v130" /><circle cx="150" cy="42" r="20" /></>,
    <><path d="M35 195h230M55 195V65h190v130M55 105h190M90 65v130M210 65v130" /><path d="m125 145 25-25 25 25v50h-50z" /></>,
    <><path d="M35 190h230M60 190 95 65h110l35 125M78 130h144M95 65l55 125 55-125" /></>,
    <><circle cx="150" cy="130" r="82" /><circle cx="150" cy="130" r="48" /><path d="M35 130h230M150 25v210M92 72l116 116M208 72 92 188" /></>,
    <><path d="M40 200 75 70h150l35 130M58 135h184M93 70v130M207 70v130" /><rect x="122" y="105" width="56" height="95" /></>,
    <><path d="M35 200h230M55 200V80l95-45 95 45v120M90 200v-80h120v80M150 35v165" /><circle cx="150" cy="86" r="22" /></>,
  ]
  return (
    <svg viewBox="0 0 300 240" aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 h-[70%] max-h-[32rem] w-auto text-grounds-primary opacity-[0.075]">
      <g fill="none" stroke="currentColor" strokeWidth="1.2">{patterns[sectionIndex]}</g>
    </svg>
  )
}

function emptyValue(field: SurveyField): SurveyValue {
  switch (field.type) {
    case 'multi-select':
      return []
    case 'checkbox':
      return false
    default:
      return ''
  }
}

function createInitialResponses(): SurveyResponses {
  return sections.reduce<SurveyResponses>((draft, section) => {
    section.fields.forEach((field) => {
      draft[field.id] = emptyValue(field)
    })
    return draft
  }, {})
}

function draftPrefix(mode: SubmissionMode) {
  return `grounds-testimony-draft:${mode}`
}

function storageKey(mode: SubmissionMode, sectionId: string) {
  return `${draftPrefix(mode)}:${sectionId}`
}

function readMeta(mode: SubmissionMode): DraftMeta | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(`${draftPrefix(mode)}:meta`)
  if (!raw) return null

  try {
    return JSON.parse(raw) as DraftMeta
  } catch {
    return null
  }
}

function readSectionDraft(mode: SubmissionMode, section: SurveySection): Partial<SurveyResponses> {
  if (typeof window === 'undefined') return {}
  const raw = window.localStorage.getItem(storageKey(mode, section.id))
  if (!raw) return {}

  try {
    return JSON.parse(raw) as Partial<SurveyResponses>
  } catch {
    return {}
  }
}

function coerceCurrency(value: string) {
  if (!value.trim()) return null
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : value
}

export function TestimonySurvey({ mode }: { mode: SubmissionMode }) {
  const [responses, setResponses] = useState<SurveyResponses>(createInitialResponses)
  const [discipline, setDiscipline] = useState<TestimonyDiscipline>('general')
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [status, setStatus] = useState<string | null>(null)
  const [submitState, setSubmitState] = useState<'idle' | 'saving' | 'success'>('idle')
  const [savedSections, setSavedSections] = useState<Record<string, number>>({})

  useEffect(() => {
    const nextResponses = createInitialResponses()
    sections.forEach((section) => {
      const sectionDraft = readSectionDraft(mode, section)
      Object.assign(nextResponses, sectionDraft)
    })

    const meta = readMeta(mode)
    const nextDiscipline =
      typeof nextResponses.discipline === 'string' &&
      TESTIMONY_DISCIPLINES.some((option) => option.value === nextResponses.discipline)
        ? (nextResponses.discipline as TestimonyDiscipline)
        : meta?.discipline ?? 'general'

    setResponses(nextResponses)
    setDiscipline(nextDiscipline)
    setCurrentSectionIndex(meta?.currentSectionIndex ?? 0)
  }, [mode])

  useEffect(() => {
    const meta: DraftMeta = { discipline, currentSectionIndex }
    window.localStorage.setItem(`${draftPrefix(mode)}:meta`, JSON.stringify(meta))
  }, [currentSectionIndex, discipline, mode])

  useEffect(() => {
    sections.forEach((section) => {
      const sectionDraft = section.fields.reduce<Partial<SurveyResponses>>((draft, field) => {
        draft[field.id] = responses[field.id] ?? emptyValue(field)
        return draft
      }, {})

      window.localStorage.setItem(storageKey(mode, section.id), JSON.stringify(sectionDraft))
    })
    setSavedSections((current) => ({ ...current, [sections[currentSectionIndex]?.id ?? 'context']: Date.now() }))
  }, [currentSectionIndex, mode, responses])

  const currentSection = sections[currentSectionIndex]
  const disciplinePrompts = facilitiesTestimonySurvey.disciplinePrompts[discipline]
  const consentLevel = typeof responses.consentLevel === 'string' ? (responses.consentLevel as ConsentLevel) : null
  const hasDocumentation = Boolean(responses.hasDocumentation)
  const contactValue = typeof responses.contact === 'string' ? responses.contact.trim() : ''

  const canGoBack = mode === 'self' && currentSectionIndex > 0
  const canGoForward = mode === 'self' && currentSectionIndex < sections.length - 1

  const incompleteRequiredFields = useMemo(() => {
    return sections.flatMap((section) =>
      section.fields
        .filter((field) => field.required)
        .filter((field) => {
          const value = responses[field.id]
          if (field.type === 'multi-select') return !Array.isArray(value) || value.length === 0
          if (field.type === 'checkbox') return value !== true
          return typeof value !== 'string' || !value.trim()
        })
        .map((field) => field.id),
    )
  }, [responses])

  function saveFieldValue(field: SurveyField, nextValue: SurveyValue) {
    setStatus(null)
    setSubmitState('idle')
    setResponses((current) => ({ ...current, [field.id]: nextValue }))
    if (field.id === 'discipline' && typeof nextValue === 'string') {
      setDiscipline(nextValue as TestimonyDiscipline)
    }
  }

  function renderField(field: SurveyField) {
    const value = responses[field.id]

    if (field.type === 'text') {
      if (field.multiline) {
        return (
          <textarea
            value={typeof value === 'string' ? value : ''}
            onChange={(event) => saveFieldValue(field, event.target.value)}
            rows={3}
            placeholder={field.placeholder}
            className={fieldClass}
          />
        )
      }

      return (
        <>
          {field.id === 'facilityName' ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {venueSuggestions.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => saveFieldValue(field, label)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition',
                    value === label
                      ? 'border-grounds-sand/55 bg-grounds-sand/15 text-grounds-sand'
                      : 'border-white/10 bg-white/[0.03] text-white/58 hover:border-white/22 hover:text-white',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
          ) : null}
          <input
            value={typeof value === 'string' ? value : ''}
            onChange={(event) => saveFieldValue(field, event.target.value)}
            placeholder={field.placeholder}
            className={fieldClass}
          />
        </>
      )
    }

    if (field.type === 'currency') {
      return (
        <input
          type="number"
          min="0"
          step="0.01"
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => saveFieldValue(field, event.target.value)}
          placeholder={field.placeholder}
          className={fieldClass}
        />
      )
    }

    if (field.type === 'single-select') {
      return (
        <div className={cn('mt-2 grid gap-2', field.id === 'discipline' ? 'grid-cols-2 sm:grid-cols-4' : 'sm:grid-cols-2')}>
          {field.options.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={value === option.value}
              onClick={() => saveFieldValue(field, option.value)}
              className={cn(
                'relative flex min-h-12 items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs transition sm:text-sm',
                value === option.value
                  ? 'border-grounds-sand/55 bg-grounds-sand/15 text-white'
                  : 'border-white/10 bg-white/[0.03] text-white/62 hover:border-white/22 hover:bg-white/[0.05]',
              )}
            >
              {field.id === 'discipline' ? disciplineIcons[option.value] : <Landmark className="h-4 w-4 shrink-0" />}
              <span>{option.label}</span>
              {value === option.value ? <Check className="ml-auto h-3.5 w-3.5 text-grounds-sand" /> : null}
            </button>
          ))}
        </div>
      )
    }

    if (field.type === 'multi-select') {
      const selected = Array.isArray(value) ? value : []
      return (
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {field.options.map((option) => {
            const checked = selected.includes(option.value)
            return (
              <label
                key={option.value}
                className={cn('flex items-start gap-2 rounded-xl border px-3 py-2 text-xs transition sm:text-sm', checked ? 'border-grounds-sand/40 bg-grounds-sand/10 text-white' : 'border-white/8 bg-white/[0.03] text-white/68')}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) => {
                    const next = event.target.checked
                      ? [...selected, option.value]
                      : selected.filter((entry) => entry !== option.value)
                    saveFieldValue(field, next)
                  }}
                  className="mt-1 h-4 w-4 rounded border-white/20 bg-[#12211c] text-grounds-sand focus:ring-grounds-sand/40"
                />
                <span>{option.label}</span>
              </label>
            )
          })}
        </div>
      )
    }

    return (
      <label className="mt-3 flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white/74">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => saveFieldValue(field, event.target.checked)}
          className="mt-1 h-4 w-4 rounded border-white/20 bg-[#12211c] text-grounds-sand focus:ring-grounds-sand/40"
        />
        <span>{field.label}</span>
      </label>
    )
  }

  function validateSection(section: SurveySection) {
    for (const field of section.fields) {
      if (!field.required) continue
      const value = responses[field.id]
      if (field.type === 'multi-select' && (!Array.isArray(value) || value.length === 0)) return false
      if (field.type === 'checkbox' && value !== true) return false
      if (typeof value !== 'string' || !value.trim()) return false
    }
    return true
  }

  function clearDraft() {
    sections.forEach((section) => window.localStorage.removeItem(storageKey(mode, section.id)))
    window.localStorage.removeItem(`${draftPrefix(mode)}:meta`)
  }

  function normalizeResponses() {
    return sections.reduce<Record<string, unknown>>((normalized, section) => {
      section.fields.forEach((field) => {
        const rawValue = responses[field.id]
        if (field.type === 'currency') {
          normalized[field.id] = coerceCurrency(typeof rawValue === 'string' ? rawValue : '')
          return
        }
        normalized[field.id] = rawValue
      })
      return normalized
    }, {})
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus(null)

    if (!db) {
      setStatus('Firestore is not configured.')
      return
    }

    if (incompleteRequiredFields.length > 0) {
      setStatus('Complete the required fields before submitting.')
      return
    }

    setSubmitState('saving')

    try {
      await addDoc(collection(db, 'groundsTestimonies'), {
        responses: normalizeResponses(),
        discipline,
        consentLevel,
        hasDocumentation,
        ...(contactValue ? { contact: contactValue } : {}),
        mode,
        ...(mode === 'interview' ? { enteredBy: 'ezra' } : {}),
        createdAt: serverTimestamp(),
      })
      clearDraft()
      setResponses(createInitialResponses())
      setDiscipline('general')
      setCurrentSectionIndex(0)
      setSubmitState('success')
      setStatus('Submitted. Thank you for adding this testimony.')
      setSavedSections({})
    } catch (error) {
      setSubmitState('idle')
      setStatus(error instanceof Error ? error.message : 'Unable to submit testimony.')
    }
  }

  const sectionCards = mode === 'self' ? [currentSection] : sections

  function goForward() {
    if (!validateSection(currentSection)) {
      setStatus('Finish the required fields in this step before continuing.')
      return
    }
    setStatus(null)
    setCurrentSectionIndex((current) => Math.min(current + 1, sections.length - 1))
  }

  function handleKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if (mode !== 'self' || event.key !== 'Enter' || !canGoForward) return
    const target = event.target as HTMLElement
    if (target.tagName === 'TEXTAREA' || target.tagName === 'BUTTON') return
    event.preventDefault()
    goForward()
  }

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      className={cn(mode === 'self' ? 'relative flex h-full flex-col overflow-hidden' : 'space-y-6')}
    >
      <section className={cn('relative flex flex-col overflow-hidden shadow-grounds', mode === 'self' ? 'h-full border-y border-white/8 bg-[#09140f]/86' : 'surface-panel')}>
        <SpatialBackdrop sectionIndex={currentSectionIndex} />

        <div className="relative z-10 border-b border-white/8 px-5 py-3 sm:px-8 sm:py-4 lg:px-12">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-5">
            <div className="min-w-0">
              <p className="eyebrow">{mode === 'self' ? 'Public testimony' : 'Interviewer intake'}</p>
              <h1 className="mt-1 text-xl font-semibold text-white sm:text-2xl">Facilities testimony</h1>
            </div>
            <div className="hidden text-right sm:block">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/36">Step {currentSectionIndex + 1} of {sections.length}</p>
              <p className="mt-1 text-sm text-white/72">{currentSection.title}</p>
            </div>
          </div>

          {mode === 'self' ? (
            <div className="mx-auto mt-3 grid max-w-7xl grid-cols-6 gap-1.5" aria-label={`Step ${currentSectionIndex + 1} of ${sections.length}`}>
              {sections.map((section, index) => (
                <div key={section.id} className="space-y-1">
                  <div className={cn('h-1 rounded-full transition-colors', index <= currentSectionIndex ? 'bg-grounds-sand' : 'bg-white/10')} />
                  <span className={cn('hidden font-mono text-[9px] uppercase tracking-[0.14em] lg:block', index === currentSectionIndex ? 'text-white/70' : 'text-white/24')}>
                    {section.title}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className={cn('relative z-10 flex-1 px-5 py-4 sm:px-8 lg:px-12', mode === 'self' ? 'min-h-0 overflow-y-auto lg:overflow-hidden' : 'space-y-5')}>
          {sectionCards.map((section, index) => {
            const absoluteIndex = mode === 'self' ? currentSectionIndex : index
            const prompt = disciplinePrompts[section.id]
            const savedAt = savedSections[section.id]

            return (
              <section
                key={section.id}
                className={cn(
                  'mx-auto max-w-7xl rounded-[1.5rem] border border-white/8 bg-[#0d1b15]/70 p-4 backdrop-blur-sm sm:p-5',
                  mode === 'self' && 'animate-testimony-step-in',
                  mode === 'interview' && 'scroll-mt-24',
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-4xl">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/36">
                      {String(absoluteIndex + 1).padStart(2, '0')} / {String(sections.length).padStart(2, '0')} · {section.title}
                      {section.optional ? ' · optional' : ''}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold leading-snug text-white sm:text-2xl">{section.anchorQuestion}</h2>
                    <p className="mt-2 max-w-3xl text-xs leading-5 text-white/54 sm:text-sm">{prompt}</p>
                  </div>
                  {savedAt ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-grounds-sand/20 bg-grounds-sand/10 px-3 py-1.5 text-xs text-grounds-sand">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Saved
                    </span>
                  ) : null}
                </div>

                <div className={cn('mt-4 grid gap-3', mode === 'interview' ? 'lg:grid-cols-2' : 'max-w-4xl lg:grid-cols-2')}>
                  {section.fields.map((field) => (
                    <div
                      key={field.id}
                      className={cn(
                        'block text-sm text-white/74',
                        field.type === 'checkbox' && 'lg:col-span-2',
                        field.multiline && 'lg:col-span-2',
                        field.type === 'multi-select' && 'lg:col-span-2',
                        field.type === 'single-select' && field.options.length > 4 && 'lg:col-span-2',
                      )}
                    >
                      {field.type === 'checkbox' ? null : (
                        <>
                          <span className="font-medium text-white">
                            {field.label}
                            {field.required ? <span className="ml-1 text-grounds-sand">*</span> : null}
                          </span>
                          {field.helperText ? <span className="mt-1 block text-xs text-white/46">{field.helperText}</span> : null}
                        </>
                      )}
                      {renderField(field)}
                    </div>
                  ))}
                </div>
              </section>
            )
          })}
        </div>

        <div className="relative z-10 border-t border-white/8 bg-[#07100c]/75 px-5 py-3 backdrop-blur-xl sm:px-8 lg:px-12">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-white/58 sm:text-sm" role="status">
          {status ? status : submitState === 'success' ? 'Submitted.' : `Consent: ${CONSENT_LEVELS.find((item) => item.value === consentLevel)?.label ?? 'not set yet'}`}
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {canGoBack ? (
            <button
              type="button"
              onClick={() => setCurrentSectionIndex((current) => current - 1)}
              className="inline-flex items-center gap-2 rounded-full border border-white/12 px-4 py-2 text-sm font-medium text-white/82 hover:bg-white/[0.04]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          ) : null}

          {canGoForward ? (
            <button
              type="button"
              onClick={goForward}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-[#0b1712]"
              style={{ backgroundColor: '#c8b97a' }}
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitState === 'saving'}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-[#0b1712] disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: '#88aa8f' }}
            >
              {submitState === 'saving' ? 'Submitting…' : 'Submit testimony'}
            </button>
          )}
          </div>
        </div>
        </div>
      </section>

      {mode === 'interview' ? (
        <p className="text-sm leading-7 text-white/52">
          Interviewer mode keeps the entire form visible for faster transcription and writes the submission with `enteredBy: &apos;ezra&apos;`.
        </p>
      ) : null}

      {submitState === 'success' ? (
        <div className="rounded-[1.5rem] border border-grounds-sand/20 bg-grounds-sand/10 p-4 text-sm text-grounds-sand">
          Draft cleared after submit. Firestore timestamp status will update once the write resolves on the server.
        </div>
      ) : null}
    </form>
  )
}
