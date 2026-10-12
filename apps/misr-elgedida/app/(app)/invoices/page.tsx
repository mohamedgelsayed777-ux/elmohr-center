import type { Metadata } from 'next'
import { ResourcePage } from '@/components/resource/resource-page'
import { RESOURCES } from '@/lib/resources'

export const metadata: Metadata = { title: RESOURCES.invoices.title }

export default async function Page({ searchParams }: PageProps<'/invoices'>) {
  return <ResourcePage resourceKey="invoices" searchParams={await searchParams} />
}
