import type { Metadata } from 'next'
import { ResourcePage } from '@/components/resource/resource-page'
import { WorkOrderFormDialog } from '@/components/work-orders/work-order-form-dialog'
import { RESOURCES } from '@/lib/resources'

export const metadata: Metadata = { title: RESOURCES.work_orders.title }

export default async function Page({ searchParams }: PageProps<'/work-orders'>) {
  const sp = await searchParams
  const selectedMonth = typeof sp.month === 'string' ? sp.month : ''
  const selectedPeriod = typeof sp.period === 'string' ? sp.period : 'month'
  const now = new Date()
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    return { value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: d.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' }) }
  })
  const emptyFormOptions = { branches: [], employees: [], customers: [], cars: [], stock: [], services: [] }

  return (
    <ResourcePage
      resourceKey="work_orders"
      searchParams={sp}
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
          <WorkOrderFormDialog {...emptyFormOptions} />
        </div>
      }
      workOrderFormProps={emptyFormOptions}
    />
  )
}
