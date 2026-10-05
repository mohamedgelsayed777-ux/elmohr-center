import type { Metadata } from 'next'
import { ResourcePage } from '@/components/resource/resource-page'
import { RESOURCES } from '@/lib/resources'

export const metadata: Metadata = { title: RESOURCES.expenses.title }

export default async function Page({ searchParams }: PageProps<'/expenses'>) {
  return <ResourcePage resourceKey="expenses" searchParams={await searchParams} />
}
