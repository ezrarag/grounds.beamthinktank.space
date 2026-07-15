import { TestimonySurvey } from '@/components/TestimonySurvey'

export default function TestimonyPage({
  searchParams,
}: {
  searchParams?: { mode?: string | string[] }
}) {
  const mode = searchParams?.mode === 'interview' ? 'interview' : 'self'

  return (
    <div className={mode === 'self' ? 'h-[calc(100dvh-68px)]' : 'mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-10'}>
      <TestimonySurvey mode={mode} />
    </div>
  )
}
