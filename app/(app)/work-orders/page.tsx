import type { Metadata } from 'next'
import { ResourcePage } from '@/components/resource/resource-page'
import { RESOURCES } from '@/lib/resources'

export const metadata: Metadata = { title: RESOURCES.work_orders.title }

export default async function Page({ searchParams }: PageProps<'/work-orders'>) {
  return <ResourcePage resourceKey="work_orders" searchParams={await searchParams} />
}
