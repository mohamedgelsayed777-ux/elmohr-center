import type { Metadata } from 'next'
import { ResourcePage } from '@/components/resource/resource-page'
import { RESOURCES } from '@/lib/resources'

export const metadata: Metadata = { title: RESOURCES.parts.title }

export default async function Page({ searchParams }: PageProps<'/parts'>) {
  return <ResourcePage resourceKey="parts" searchParams={await searchParams} />
}
