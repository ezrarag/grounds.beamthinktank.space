import { PropertyViewportCard } from '@/components/PropertyViewportCard'

export default function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      <PropertyViewportCard />
    </div>
  )
}
