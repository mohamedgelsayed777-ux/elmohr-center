import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ResourcePage } from '@/components/resource/resource-page'
import { WorkOrderFormDialog } from '@/components/work-orders/work-order-form-dialog'
import { RESOURCES } from '@/lib/resources'

export const metadata: Metadata = { title: RESOURCES.work_orders.title }

export default async function Page({ searchParams }: PageProps<'/work-orders'>) {
  const supabase = await createClient()
  const sp = await searchParams
  const selectedMonth = typeof sp.month === 'string' ? sp.month : ''
  const selectedPeriod = typeof sp.period === 'string' ? sp.period : 'month'
  const [{ data: branches }, { data: employees }, { data: customers }, { data: cars }, { data: stock }, { data: services }] = await Promise.all([
    supabase.from('branches').select('id,name').eq('is_active', true).order('name'),
    supabase.from('employees').select('id,full_name').eq('status', 'active').order('full_name'),
    supabase.from('customers').select('id,full_name,phone,branch_id').order('full_name').limit(1000),
    supabase.from('cars').select('id,customer_id,make,model,year,plate_number,vin,color,mileage').order('created_at', { ascending: false }).limit(2000),
    supabase.from('parts').select('id,name,sku,part_number,quantity,sale_price,inventory_type,branch_id').gte('quantity', 0).order('name'),
    supabase.from('services').select('id,name,price,category').eq('is_active', true).order('name'),
  ])
  const now = new Date()
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    return { value: d.toISOString().slice(0, 7), label: d.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' }) }
  })

  return (
    <ResourcePage
      resourceKey="work_orders"
      searchParams={await searchParams}
      headerActions={
        <div className="flex flex-wrap items-center gap-2">
          <form method="get" className="flex flex-wrap items-center gap-2">
            <select name="period" defaultValue={selectedPeriod} className="h-10 rounded-md border bg-background px-3 text-sm">
              <option value="day">اليوم</option>
              <option value="week">هذا الأسبوع</option>
              <option value="month">هذا الشهر</option>
              <option value="all">كل الأوامر</option>
            </select>
            <select name="month" defaultValue={selectedMonth} className="h-10 rounded-md border bg-background px-3 text-sm">
              <option value="">شهر محدد</option>
              {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <button type="submit" className="h-10 rounded-md border px-3 text-sm">عرض</button>
          </form>
          <WorkOrderFormDialog
            branches={(branches ?? []).map(x => ({ value: x.id, label: x.name }))}
            employees={(employees ?? []).map(x => ({ value: x.id, label: x.full_name }))}
            customers={(customers ?? []).map(x => ({ value: x.id, label: x.full_name, phone: x.phone ?? '', branch_id: x.branch_id }))}
            cars={(cars ?? []).map(x => ({
              id: x.id,
              customer_id: x.customer_id,
              make: x.make ?? '',
              model: x.model ?? '',
              year: x.year ?? null,
              plate_number: x.plate_number ?? '',
              vin: x.vin ?? '',
              color: x.color ?? '',
              mileage: x.mileage ?? null,
            }))}
            stock={(stock ?? []).map(x => ({ ...x, branch_id: x.branch_id ?? null, inventory_type: (x.inventory_type === 'oil' ? 'oil' : x.inventory_type === 'filter' ? 'filter' : 'part') as 'part'|'filter'|'oil' }))}
            services={(services ?? []).map(x => ({ id: x.id, name: x.name, price: Number(x.price ?? 0), category: x.category ?? null }))}
          />
        </div>
      }
    />
  )
}
