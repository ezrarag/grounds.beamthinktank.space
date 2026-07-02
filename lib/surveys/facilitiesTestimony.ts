export type TestimonyDiscipline = 'music' | 'visual-arts' | 'engineering' | 'general'

export type ConsentLevel =
  | 'private-grounds-only'
  | 'partner-review-anonymized'
  | 'public-anonymized'
  | 'public-attributed'

export type SurveyFieldType = 'text' | 'currency' | 'single-select' | 'multi-select' | 'checkbox'

export interface SurveyOption<Value extends string = string> {
  value: Value
  label: string
}

interface SurveyFieldBase {
  id: string
  label: string
  type: SurveyFieldType
  helperText?: string
  placeholder?: string
  required?: boolean
  multiline?: boolean
}

export interface TextSurveyField extends SurveyFieldBase {
  type: 'text'
}

export interface CurrencySurveyField extends SurveyFieldBase {
  type: 'currency'
}

export interface SingleSelectSurveyField extends SurveyFieldBase {
  type: 'single-select'
  options: SurveyOption[]
}

export interface MultiSelectSurveyField extends SurveyFieldBase {
  type: 'multi-select'
  options: SurveyOption[]
}

export interface CheckboxSurveyField extends SurveyFieldBase {
  type: 'checkbox'
}

export type SurveyField =
  | TextSurveyField
  | CurrencySurveyField
  | SingleSelectSurveyField
  | MultiSelectSurveyField
  | CheckboxSurveyField

export interface SurveySection {
  id: 'context' | 'access' | 'cost-transparency' | 'consequences' | 'alternative' | 'consent'
  title: string
  anchorQuestion: string
  fields: SurveyField[]
  optional?: boolean
}

export type DisciplinePrompts = Record<TestimonyDiscipline, Record<SurveySection['id'], string>>

export const TESTIMONY_DISCIPLINES: SurveyOption<TestimonyDiscipline>[] = [
  { value: 'music', label: 'Music' },
  { value: 'visual-arts', label: 'Visual arts' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'general', label: 'General / interdisciplinary' },
]

export const CONSENT_LEVELS: SurveyOption<ConsentLevel>[] = [
  { value: 'private-grounds-only', label: 'Keep this private to Grounds staff.' },
  { value: 'partner-review-anonymized', label: 'Share anonymously with aligned partners for planning and advocacy.' },
  { value: 'public-anonymized', label: 'Share publicly, but remove my name and direct identifiers.' },
  { value: 'public-attributed', label: 'Share publicly and allow attribution if helpful.' },
]

export const facilitiesTestimonySurvey: { sections: SurveySection[]; disciplinePrompts: DisciplinePrompts } = {
  sections: [
    {
      id: 'context',
      title: 'Context',
      anchorQuestion: 'What facility, program space, or operating context are you speaking from, and what were you trying to do there?',
      fields: [
        {
          id: 'discipline',
          label: 'Discipline',
          type: 'single-select',
          required: true,
          options: TESTIMONY_DISCIPLINES,
        },
        {
          id: 'facilityName',
          label: 'Facility, venue, shop, lab, or building',
          type: 'text',
          required: true,
          placeholder: 'Name the place if you know it.',
        },
        {
          id: 'facilityLocation',
          label: 'Location',
          type: 'text',
          placeholder: 'Neighborhood, city, school, or address',
        },
        {
          id: 'contextNarrative',
          label: 'Your situation',
          type: 'text',
          required: true,
          multiline: true,
          placeholder: 'Describe what you needed from the space and why it mattered.',
        },
      ],
    },
    {
      id: 'access',
      title: 'Access',
      anchorQuestion: 'What made access difficult, delayed, unstable, or impossible?',
      fields: [
        {
          id: 'accessBarriers',
          label: 'What barriers showed up?',
          type: 'multi-select',
          required: true,
          options: [
            { value: 'hours', label: 'Hours or scheduling' },
            { value: 'distance', label: 'Distance or transportation' },
            { value: 'eligibility', label: 'Eligibility or gatekeeping' },
            { value: 'equipment', label: 'Missing equipment or infrastructure' },
            { value: 'safety', label: 'Safety or building condition' },
            { value: 'capacity', label: 'No available slots / capacity' },
            { value: 'communication', label: 'Could not get a clear answer' },
            { value: 'other', label: 'Other' },
          ],
        },
        {
          id: 'accessNarrative',
          label: 'What happened?',
          type: 'text',
          required: true,
          multiline: true,
          placeholder: 'Walk through the access problem in concrete terms.',
        },
      ],
    },
    {
      id: 'cost-transparency',
      title: 'Cost Transparency',
      anchorQuestion: 'What were you asked to pay, and how clear or unclear were those costs up front?',
      fields: [
        {
          id: 'quotedCost',
          label: 'Quoted or expected cost (USD)',
          type: 'currency',
          placeholder: '0',
        },
        {
          id: 'costClarity',
          label: 'How clear were the costs?',
          type: 'single-select',
          required: true,
          options: [
            { value: 'clear', label: 'Clear from the beginning' },
            { value: 'partial', label: 'Partly clear, but key details were missing' },
            { value: 'late-change', label: 'Changed late in the process' },
            { value: 'unclear', label: 'Never made clear' },
          ],
        },
        {
          id: 'costNarrative',
          label: 'Cost notes',
          type: 'text',
          multiline: true,
          placeholder: 'Include fees, deposits, supplies, insurance, storage, overtime, or anything else that mattered.',
        },
      ],
    },
    {
      id: 'consequences',
      title: 'Consequences',
      anchorQuestion: 'What did the facility problem cost you in lost work, lost time, or missed opportunity?',
      optional: true,
      fields: [
        {
          id: 'consequencesExperienced',
          label: 'What consequences applied?',
          type: 'multi-select',
          options: [
            { value: 'lost-income', label: 'Lost income' },
            { value: 'lost-audience', label: 'Lost audience, clients, or collaborators' },
            { value: 'delayed-project', label: 'Delayed or canceled project' },
            { value: 'lost-education', label: 'Lost learning or training time' },
            { value: 'reputational', label: 'Reputational or relationship damage' },
            { value: 'health', label: 'Stress, exhaustion, or health impact' },
            { value: 'other', label: 'Other' },
          ],
        },
        {
          id: 'consequencesNarrative',
          label: 'What changed because of it?',
          type: 'text',
          multiline: true,
          placeholder: 'Describe the practical effect on your work, life, or program.',
        },
      ],
    },
    {
      id: 'alternative',
      title: 'Alternative',
      anchorQuestion: 'What would a workable alternative have looked like?',
      fields: [
        {
          id: 'alternativeType',
          label: 'What kind of alternative would have helped most?',
          type: 'single-select',
          required: true,
          options: [
            { value: 'dedicated-space', label: 'Dedicated long-term space' },
            { value: 'shared-space', label: 'Shared community space' },
            { value: 'short-term-booking', label: 'Reliable short-term booking' },
            { value: 'subsidy', label: 'Subsidy, scholarship, or reduced cost' },
            { value: 'equipment-access', label: 'Equipment or infrastructure access' },
            { value: 'technical-support', label: 'Technical, code, or permitting support' },
            { value: 'other', label: 'Other' },
          ],
        },
        {
          id: 'alternativeNarrative',
          label: 'Describe the alternative',
          type: 'text',
          required: true,
          multiline: true,
          placeholder: 'What would have changed the outcome for you?',
        },
      ],
    },
    {
      id: 'consent',
      title: 'Consent',
      anchorQuestion: 'How may Grounds use this testimony, and can you provide any follow-up materials if needed?',
      fields: [
        {
          id: 'consentLevel',
          label: 'Consent level',
          type: 'single-select',
          required: true,
          options: CONSENT_LEVELS,
        },
        {
          id: 'hasDocumentation',
          label: 'I have documentation that could support this testimony if Grounds follows up.',
          type: 'checkbox',
        },
        {
          id: 'contact',
          label: 'Contact information (optional)',
          type: 'text',
          placeholder: 'Email, phone, or best follow-up method',
        },
      ],
    },
  ],
  disciplinePrompts: {
    music: {
      context: 'Example: rehearsal space, lesson rooms, storage for instruments, a venue, or a recording setup you needed to access.',
      access: 'Example: limited rehearsal hours, no secure instrument storage, inaccessible loading access, or last-minute cancellation of a venue.',
      'cost-transparency': 'Example: surprise sound engineer fees, rehearsal add-ons, deposits, insurance, or minimum booking thresholds.',
      consequences: 'Example: a canceled performance, lost teaching income, damaged instruments, or collaborators walking away.',
      alternative: 'Example: a code-compliant rehearsal hub, shared recording room, reliable recital space, or subsidized booking model.',
      consent: 'Choose how far this story can travel beyond Grounds and whether we should contact you for supporting materials.',
    },
    'visual-arts': {
      context: 'Example: studio space, fabrication area, kiln access, exhibition space, storage, or a classroom-based making environment.',
      access: 'Example: no secure storage, building restrictions, ventilation issues, inaccessible freight access, or impossible booking windows.',
      'cost-transparency': 'Example: hidden install fees, short-term rental markups, material handling charges, or unclear exhibition costs.',
      consequences: 'Example: damaged work, canceled installation, missed commission deadlines, or losing visibility with curators or buyers.',
      alternative: 'Example: shared studio infrastructure, climate-controlled storage, exhibition-ready space, or predictable fabrication access.',
      consent: 'Choose how far this story can travel beyond Grounds and whether we should contact you for supporting materials.',
    },
    engineering: {
      context: 'Example: prototyping lab, workshop, teaching lab, robotics space, makerspace, or code-compliant build area you needed.',
      access: 'Example: equipment gatekeeping, unsafe facilities, certification bottlenecks, lack of evening access, or missing power/data capacity.',
      'cost-transparency': 'Example: unexpected lab fees, insurance requirements, fabrication minimums, permit costs, or opaque equipment charges.',
      consequences: 'Example: delayed prototypes, missed competitions, lost contract work, failed testing windows, or broken team coordination.',
      alternative: 'Example: a reliable community prototyping shop, shared test infrastructure, safer facilities, or supported permitting/code review.',
      consent: 'Choose how far this story can travel beyond Grounds and whether we should contact you for supporting materials.',
    },
    general: {
      context: 'Example: a classroom, community room, office, workshop, performance space, or neighborhood building you needed to use.',
      access: 'Example: you were priced out, denied access, could not schedule it, or the building could not support the work.',
      'cost-transparency': 'Example: fees showed up late, the real total was never clear, or required add-ons made the space unusable.',
      consequences: 'Example: lost time, lost money, canceled work, or practical setbacks for you or your group.',
      alternative: 'Example: a stable, affordable, well-equipped facility model that would have made the work possible.',
      consent: 'Choose how far this story can travel beyond Grounds and whether we should contact you for supporting materials.',
    },
  },
}
