import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ResourcePage } from '@/components/resource/resource-page'
import { WorkOrderFormDialog } from '@/components/work-orders/work-order-form-dialog'
import { RESOURCES } from '@/lib/resources'

export const metadata: Metadata = { title: RESOURCES.work_orders.title }

export default async function Page({ searchParams }: PageProps<'/work-orders'>) {
  const supabase = await createClient()
  const [{ data: branches }, { data: employees }, { data: vehicles }, { data: stock }] = await Promise.all([
    supabase.from('branches').select('id,name').eq('is_active', true).order('name'),
    supabase.from('employees').select('id,full_name').eq('status', 'active').order('full_name'),
    supabase.from('vehicle_catalog').select('make,model').order('make').order('model'),
    supabase.from('parts').select('id,name,quantity,sale_price,inventory_type').gte('quantity', 0).order('name'),
  ])
  return (
    <ResourcePage
      resourceKey="work_orders"
      searchParams={await searchParams}
      headerActions={
        <WorkOrderFormDialog
          branches={(branches ?? []).map(x => ({ value: x.id, label: x.name }))}
          employees={(employees ?? []).map(x => ({ value: x.id, label: x.full_name }))}
          vehicles={vehicles ?? []}
          stock={(stock ?? []).map(x => ({ ...x, inventory_type: (x.inventory_type === 'oil' ? 'oil' : 'part') as 'part'|'oil' }))}
        />
      }
    />
  )
}
