import type { Metadata } from 'next'
import { ResourcePage } from '@/components/resource/resource-page'
import { RESOURCES } from '@/lib/resources'

export const metadata: Metadata = { title: RESOURCES.branches.title }

export default async function Page({ searchParams }: PageProps<'/branches'>) {
  return <ResourcePage resourceKey="branches" searchParams={await searchParams} />
}
