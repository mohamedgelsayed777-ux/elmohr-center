import type { Metadata } from 'next'
import { ResourcePage } from '@/components/resource/resource-page'
import { RESOURCES } from '@/lib/resources'

export const metadata: Metadata = { title: RESOURCES.customers.title }

export default async function Page({ searchParams }: PageProps<'/customers'>) {
  return <ResourcePage resourceKey="customers" searchParams={await searchParams} />
}
