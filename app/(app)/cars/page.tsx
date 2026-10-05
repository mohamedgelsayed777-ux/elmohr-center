import type { Metadata } from 'next'
import { ResourcePage } from '@/components/resource/resource-page'
import { RESOURCES } from '@/lib/resources'

export const metadata: Metadata = { title: RESOURCES.cars.title }

export default async function Page({ searchParams }: PageProps<'/cars'>) {
  return <ResourcePage resourceKey="cars" searchParams={await searchParams} />
}
