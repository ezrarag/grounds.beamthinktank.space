'use client'

import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react'
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
  'mt-2 w-full rounded-2xl border border-white/10 bg-[#12211c] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-grounds-sand/50'

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
  const progressValue = mode === 'self' ? ((currentSectionIndex + 1) / sections.length) * 100 : 100

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
            rows={5}
            placeholder={field.placeholder}
            className={fieldClass}
          />
        )
      }

      return (
        <input
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => saveFieldValue(field, event.target.value)}
          placeholder={field.placeholder}
          className={fieldClass}
        />
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
        <select
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => saveFieldValue(field, event.target.value)}
          className={fieldClass}
        >
          <option value="">Select one…</option>
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )
    }

    if (field.type === 'multi-select') {
      const selected = Array.isArray(value) ? value : []
      return (
        <div className="mt-3 grid gap-2">
          {field.options.map((option) => {
            const checked = selected.includes(option.value)
            return (
              <label
                key={option.value}
                className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white/74"
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="surface-panel overflow-hidden shadow-grounds">
        <div className="border-b border-white/8 px-6 py-5 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="eyebrow">{mode === 'self' ? 'Public testimony' : 'Interviewer intake'}</p>
              <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Facilities testimony</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-white/68">
                Grounds is collecting concrete accounts of how facilities, access, and cost structures shape real work.
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-white/10 bg-[#12211c] px-4 py-3 text-right">
              <p className="text-xs uppercase tracking-[0.2em] text-white/36">Mode</p>
              <p className="mt-1 text-sm font-medium text-white">{mode === 'self' ? 'Self-submitted' : 'Interviewer-led'}</p>
            </div>
          </div>
          <div className="mt-6">
            <div className="h-2 overflow-hidden rounded-full bg-white/8">
              <div className="h-full rounded-full bg-grounds-sand transition-all" style={{ width: `${progressValue}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-white/40">
              <span>
                {mode === 'self' ? `Section ${currentSectionIndex + 1} of ${sections.length}` : `${sections.length} sections`}
              </span>
              <span>{mode === 'self' ? currentSection.title : 'Complete in one sitting or continue from draft'}</span>
            </div>
          </div>
        </div>

        <div className={cn('px-6 py-6 sm:px-8', mode === 'interview' && 'space-y-5')}>
          {sectionCards.map((section, index) => {
            const absoluteIndex = mode === 'self' ? currentSectionIndex : index
            const prompt = disciplinePrompts[section.id]
            const savedAt = savedSections[section.id]

            return (
              <section
                key={section.id}
                className={cn(
                  'rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5',
                  mode === 'interview' && 'scroll-mt-24',
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/36">
                      {absoluteIndex + 1}. {section.title}
                      {section.optional ? ' · optional' : ''}
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold text-white">{section.anchorQuestion}</h2>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-white/64">{prompt}</p>
                  </div>
                  {savedAt ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-grounds-sand/20 bg-grounds-sand/10 px-3 py-1.5 text-xs text-grounds-sand">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Saved
                    </span>
                  ) : null}
                </div>

                <div className={cn('mt-6 grid gap-4', mode === 'interview' ? 'lg:grid-cols-2' : 'max-w-3xl')}>
                  {section.fields.map((field) => (
                    <label
                      key={field.id}
                      className={cn(
                        'block text-sm text-white/74',
                        field.type === 'checkbox' && 'lg:col-span-2',
                        field.multiline && mode === 'interview' && 'lg:col-span-2',
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
                    </label>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-white/58">
          {status ? status : submitState === 'success' ? 'Submitted.' : `Consent: ${CONSENT_LEVELS.find((item) => item.value === consentLevel)?.label ?? 'not set yet'}`}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {canGoBack ? (
            <button
              type="button"
              onClick={() => setCurrentSectionIndex((current) => current - 1)}
              className="inline-flex items-center gap-2 rounded-full border border-white/12 px-4 py-2.5 text-sm font-medium text-white/82 hover:bg-white/[0.04]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          ) : null}

          {canGoForward ? (
            <button
              type="button"
              onClick={() => {
                if (!validateSection(currentSection)) {
                  setStatus('Finish the required fields in this section before continuing.')
                  return
                }
                setCurrentSectionIndex((current) => current + 1)
              }}
              className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-[#0b1712]"
              style={{ backgroundColor: '#c8b97a' }}
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitState === 'saving'}
              className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-[#0b1712] disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: '#88aa8f' }}
            >
              {submitState === 'saving' ? 'Submitting…' : 'Submit testimony'}
            </button>
          )}
        </div>
      </div>

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
