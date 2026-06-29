import { notFound } from 'next/navigation'
import { ProjectView } from '@/components/projects/ProjectView'
import { getProject } from '@/lib/redevelopment'

export const dynamic = 'force-dynamic'

export default async function ProjectPage({ params }: { params: { slug: string } }) {
  const projectBundle = await getProject(params.slug)

  if (!projectBundle?.project.isPublished) {
    notFound()
  }

  return <ProjectView {...projectBundle} />
}

