import { NextResponse } from 'next/server'
import { getAllProjects, getPublishedProjects } from '@/lib/redevelopment'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('mode') || 'participant'

  try {
    const projects = mode === 'admin' ? await getAllProjects() : await getPublishedProjects()
    return NextResponse.json({ projects })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}
