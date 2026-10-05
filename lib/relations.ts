import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { Option, RelationKey, Resource } from '@/lib/resources'

type Row = Record<string, unknown>

const RELATION_QUERIES: Record<
  RelationKey,
  { table: string; select: string; order: string; label: (r: Row) => string }
> = {
  branches: {
    table: 'branches',
    select: 'id, name',
    order: 'name',
    label: (r) => String(r.name ?? ''),
  },
  customers: {
    table: 'customers',
    select: 'id, full_name, phone',
    order: 'full_name',
    label: (r) => `${r.full_name ?? ''} — ${r.phone ?? ''}`,
  },
  cars: {
    table: 'cars',
    select: 'id, make, model, plate_number, customer:customers(full_name)',
    order: 'plate_number',
    label: (r) => {
      const owner = (r.customer as Row | null)?.full_name
      return `${r.plate_number ?? ''} — ${r.make ?? ''} ${r.model ?? ''}${owner ? ` (${owner})` : ''}`
    },
  },
  employees: {
    table: 'employees',
    select: 'id, full_name, job_title',
    order: 'full_name',
    label: (r) => `${r.full_name ?? ''} — ${r.job_title ?? ''}`,
  },
  work_orders: {
    table: 'work_orders',
    select: 'id, order_number, customer:customers(full_name)',
    order: 'order_number',
    label: (r) => `#${r.order_number} — ${(r.customer as Row | null)?.full_name ?? ''}`,
  },
}

export async function loadRelationOptions(resource: Resource) {
  const keys = new Set<RelationKey>()
  resource.fields.forEach((f) => f.relation && keys.add(f.relation))
  resource.filters.forEach((f) => f.relation && keys.add(f.relation))

  const supabase = await createClient()
  const entries = await Promise.all(
    [...keys].map(async (key) => {
      const q = RELATION_QUERIES[key]
      const { data } = await supabase
        .from(q.table)
        .select(q.select)
        .order(q.order, { ascending: key !== 'work_orders' })
        .limit(500)
      const options: Option[] = ((data ?? []) as unknown as Row[]).map((r) => ({
        value: String(r.id),
        label: q.label(r),
      }))
      return [key, options] as const
    }),
  )

  return Object.fromEntries(entries) as Partial<Record<RelationKey, Option[]>>
}
