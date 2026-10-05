import type { Metadata } from 'next'
import { ResourcePage } from '@/components/resource/resource-page'
import { RESOURCES } from '@/lib/resources'

export const metadata: Metadata = { title: RESOURCES.services.title }

export default async function Page({ searchParams }: PageProps<'/services'>) {
  return <ResourcePage resourceKey="services" searchParams={await searchParams} />
}
