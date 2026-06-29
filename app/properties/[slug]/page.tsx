import { notFound } from 'next/navigation'
import { PublicPropertyDetailView } from '@/components/properties/PublicPropertyDetailView'
import { getPublicPropertyBySlug } from '@/lib/publicProperties'

export const dynamic = 'force-dynamic'

export default async function PublicPropertyPage({ params }: { params: { slug: string } }) {
  const site = await getPublicPropertyBySlug(params.slug)

  if (!site) {
    notFound()
  }

  return <PublicPropertyDetailView site={site} />
}

