import type { Metadata } from 'next'
import { ResourcePage } from '@/components/resource/resource-page'
import { RESOURCES } from '@/lib/resources'

export const metadata: Metadata = { title: RESOURCES.employees.title }

export default async function Page({ searchParams }: PageProps<'/employees'>) {
  return <ResourcePage resourceKey="employees" searchParams={await searchParams} />
}
