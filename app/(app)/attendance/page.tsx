import type { Metadata } from 'next'
import { ResourcePage } from '@/components/resource/resource-page'
import { RESOURCES } from '@/lib/resources'

export const metadata: Metadata = { title: RESOURCES.attendance.title }

export default async function Page({ searchParams }: PageProps<'/attendance'>) {
  return <ResourcePage resourceKey="attendance" searchParams={await searchParams} />
}
