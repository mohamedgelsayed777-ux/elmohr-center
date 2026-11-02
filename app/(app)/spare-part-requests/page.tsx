import type { Metadata } from 'next'
import { ResourcePage } from '@/components/resource/resource-page'

export const metadata: Metadata = { title: 'سجل طلبات قطع الغيار' }

export default async function Page({ searchParams }: PageProps<'/spare-part-requests'>) {
  return <ResourcePage resourceKey="spare_part_requests" searchParams={await searchParams} />
}
