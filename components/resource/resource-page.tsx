import Link from 'next/link'
import { ChevronLeft, ChevronRight, Inbox, Printer } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { loadRelationOptions } from '@/lib/relations'
import { RESOURCES, type ResourceKey } from '@/lib/resources'
import { formatNumber } from '@/lib/format'
import { PageHeader } from '@/components/app/page-header'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CellValue } from './cell-value'
import { ResourceToolbar, type ToolbarFilter } from './resource-toolbar'
import { ResourceFormDialog } from './resource-form-dialog'
import { DeleteButton } from './delete-button'

const PAGE_SIZE = 20
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type SearchParams = Record<string, string | string[] | undefined>

function param(sp: SearchParams, key: string) {
  const v = sp[key]
  return (Array.isArray(v) ? v[0] : v)?.trim() ?? ''
}

function sanitizeSearch(q: string) {
  return q.replace(/[,()*%\\:"']/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80)
}

export async function ResourcePage({
  resourceKey,
  searchParams,
  headerActions,
}: {
  resourceKey: ResourceKey
  searchParams: SearchParams
  headerActions?: React.ReactNode
}) {
  const resource = RESOURCES[resourceKey]
  const supabase = await createClient()
  const { data: roleData } = await supabase.rpc('current_user_role')
  const accountantAddOnly = roleData === 'accountant' && ['attendance', 'services', 'parts'].includes(resourceKey)
  const relationOptions = await loadRelationOptions(resource)
  const inventoryType = resourceKey === 'parts' ? param(searchParams, 'inventory_type') : ''
  const inventoryTitle = resourceKey === 'parts' && inventoryType === 'part' ? 'مخزن قطع الغيار' : resourceKey === 'parts' && inventoryType === 'filter' ? 'مخزن الفلاتر' : resourceKey === 'parts' && inventoryType === 'oil' ? 'مخزن الزيوت' : resource.title

  const page = Math.max(1, Number.parseInt(param(searchParams, 'page'), 10) || 1)
  const search = sanitizeSearch(param(searchParams, 'q'))
  const month = param(searchParams, 'month')
  const year = param(searchParams, 'year')
  const day = param(searchParams, 'day')

  let query = supabase
    .from(resource.table)
    .select(resource.select, { count: 'exact' })
    .order(resource.orderBy.column, { ascending: resource.orderBy.ascending })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  if (['attendance', 'invoices', 'work_orders'].includes(resourceKey) && (year || month || day)) {
    const now = new Date()
    const selectedYear = /^\d{4}$/.test(year) ? Number(year) : now.getFullYear()
    const selectedMonth = /^\d{2}$/.test(month) ? Number(month) : 0
    const selectedDay = /^\d{2}$/.test(day) ? Number(day) : 0
    const daysInSelectedMonth = selectedMonth >= 1 && selectedMonth <= 12
      ? new Date(selectedYear, selectedMonth, 0).getDate()
      : 0
    let start: Date
    let end: Date
    if (selectedMonth >= 1 && selectedMonth <= 12 && selectedDay >= 1 && selectedDay <= daysInSelectedMonth) {
      start = new Date(selectedYear, selectedMonth - 1, selectedDay)
      end = new Date(selectedYear, selectedMonth - 1, selectedDay + 1)
    } else if (selectedMonth >= 1 && selectedMonth <= 12) {
      start = new Date(selectedYear, selectedMonth - 1, 1)
      end = new Date(selectedYear, selectedMonth, 1)
    } else {
      start = new Date(selectedYear, 0, 1)
      end = new Date(selectedYear + 1, 0, 1)
    }
    const dateColumn = resourceKey === 'attendance' ? 'attendance_date' : resourceKey === 'invoices' ? 'issued_at' : 'opened_at'
    query = query.gte(dateColumn, resourceKey === 'attendance' ? start.toISOString().slice(0, 10) : start.toISOString())
      .lt(dateColumn, resourceKey === 'attendance' ? end.toISOString().slice(0, 10) : end.toISOString())
  }

  if (search && resource.searchColumns.length) {
    const numeric = /^\d+$/.test(search)
    const clauses = resource.searchColumns.flatMap((col) => {
      if (col.endsWith('_number')) return numeric ? [`${col}.eq.${search}`] : []
      return [`${col}.ilike.*${search}*`]
    })
    if (clauses.length) query = query.or(clauses.join(','))
  }

  const categoryOptionsByInventoryType = {
    part: ['ميكانيكا', 'كهرباء', 'عفشة', 'كماليات', 'اصناف اخرى'],
    filter: ['فلاتر هواء', 'فلاتر زيت', 'اصناف اخرى'],
    oil: ['زيت موتور', 'زيت فتيس', 'اصناف اخرى'],
  }
  const toolbarFilters: ToolbarFilter[] = []
  for (const filter of resource.filters) {
    const options =
      resourceKey === 'parts' && filter.name === 'category' && inventoryType in categoryOptionsByInventoryType
        ? categoryOptionsByInventoryType[inventoryType as keyof typeof categoryOptionsByInventoryType].map((value) => ({ value, label: value }))
        : filter.relation
          ? relationOptions[filter.relation] ?? []
          : filter.options ?? []
    toolbarFilters.push({ name: filter.name, label: filter.label, options })
    const value = param(searchParams, filter.name)
    if (!value) continue
    const valid = filter.relation ? UUID_RE.test(value) : options.some((o) => o.value === value)
    if (valid) query = query.eq(filter.name, value)
  }

  if (resourceKey === 'parts' && ['part', 'filter', 'oil'].includes(inventoryType)) {
    query = query.eq('inventory_type', inventoryType)
  }

  const { data, count, error } = await query
  const rows = (data ?? []) as unknown as Record<string, unknown>[]
  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const primary = resource.columns.find((c) => c.primary) ?? resource.columns[0]
  const secondary = resource.columns.find((c) => c.secondary)
  const details = resource.columns.filter((c) => c !== primary && c !== secondary)

  const pageHref = (p: number) => {
    const params = new URLSearchParams()
    Object.entries(searchParams).forEach(([k, v]) => {
      const s = Array.isArray(v) ? v[0] : v
      if (s && k !== 'page') params.set(k, s)
    })
    if (p > 1) params.set('page', String(p))
    return `${resource.path}${params.size ? `?${params}` : ''}`
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col">
      <PageHeader
        title={inventoryTitle}
        description={resource.description}
        actions={
          headerActions ?? (
            <ResourceFormDialog
              resourceKey={resource.key}
              singular={resource.singular}
              fields={resource.fields}
              relationOptions={relationOptions}
              inventoryType={resourceKey === 'parts' && ['part', 'filter', 'oil'].includes(inventoryType) ? inventoryType as 'part' | 'filter' | 'oil' : undefined}
            />
          )
        }
      />

      <ResourceToolbar
        searchPlaceholder={resource.searchPlaceholder}
        filters={toolbarFilters}
        dateFilter={['attendance', 'invoices', 'work_orders'].includes(resourceKey) ? { enabled: true, year, month, day } : undefined}
      />

      <p className="mb-3 text-sm text-muted-foreground">
        {`إجمالي السجلات: ${formatNumber(total)}`}
      </p>

      {error ? (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
          تعذر تحميل البيانات، يرجى المحاولة مرة أخرى.
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed bg-card px-6 py-14 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <Inbox className="size-6 text-muted-foreground" aria-hidden="true" />
          </div>
          <p className="font-medium">{search ? 'لا توجد نتائج مطابقة' : `لا يوجد ${resource.title} بعد`}</p>
          <p className="text-sm text-muted-foreground">
            {search ? 'جرّب كلمة بحث مختلفة أو امسح الفلاتر' : `ابدأ بإضافة ${resource.singular} جديد`}
          </p>
        </div>
      ) : (
        <>
          <ul className="flex flex-col gap-3 md:hidden">
            {rows.map((row) => (
              <li key={String(row.id)} className="rounded-lg border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-col gap-1">
                    <p className="truncate font-semibold">
                      <CellValue column={primary} row={row} />
                    </p>
                    {secondary && (
                      <p className="text-sm text-muted-foreground">
                        <CellValue column={secondary} row={row} />
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center">
                    {resourceKey === 'invoices' && <Link href={`/invoices/${String(row.id)}/print`} target="_blank" aria-label="طباعة الفاتورة" className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }))}><Printer className="size-4" /></Link>}
                    {!accountantAddOnly && (
                      <>
<ResourceFormDialog
                      resourceKey={resource.key}
                      singular={resource.singular}
                      fields={resource.fields}
                      relationOptions={relationOptions}
                      record={row}
                      inventoryType={resourceKey === 'parts' && ['part', 'filter', 'oil'].includes(inventoryType) ? inventoryType as 'part' | 'filter' | 'oil' : undefined}
                    />
                    <DeleteButton resourceKey={resource.key} id={String(row.id)} singular={resource.singular} />
                      </>
                    )}
                  </div>
                </div>
                {details.length > 0 && (
                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t pt-3 text-sm">
                    {details.map((col) => (
                      <div key={col.key} className="flex min-w-0 flex-col gap-0.5">
                        <dt className="text-xs text-muted-foreground">{col.label}</dt>
                        <dd className="truncate">
                          <CellValue column={col} row={row} />
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto rounded-lg border bg-card md:block">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  {resource.columns.map((col) => (
                    <th
                      key={col.key}
                      scope="col"
                      className={cn(
                        'whitespace-nowrap px-4 py-3 text-start font-medium text-muted-foreground',
                        col.hideOnMobile && 'hidden lg:table-cell',
                      )}
                    >
                      {col.label}
                    </th>
                  ))}
                  <th scope="col" className="px-4 py-3">
                    <span className="sr-only">إجراءات</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((row) => (
                  <tr key={String(row.id)} className="transition-colors hover:bg-muted/40">
                    {resource.columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          'px-4 py-3',
                          col.primary && 'font-medium',
                          col.hideOnMobile && 'hidden lg:table-cell',
                        )}
                      >
                        <CellValue column={col} row={row} />
                      </td>
                    ))}
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-end gap-1">
                        {resourceKey === 'invoices' && <Link href={`/invoices/${String(row.id)}/print`} target="_blank" aria-label="طباعة الفاتورة" className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }))}><Printer className="size-4" /></Link>}
                        {!accountantAddOnly && (
                          <>
<ResourceFormDialog
                          resourceKey={resource.key}
                          singular={resource.singular}
                          fields={resource.fields}
                          relationOptions={relationOptions}
                          record={row}
                          inventoryType={resourceKey === 'parts' && ['part', 'filter', 'oil'].includes(inventoryType) ? inventoryType as 'part' | 'filter' | 'oil' : undefined}
                        />
                        <DeleteButton resourceKey={resource.key} id={String(row.id)} singular={resource.singular} />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <nav aria-label="التنقل بين الصفحات" className="mt-4 flex items-center justify-between gap-3">
              <Link
                href={pageHref(page - 1)}
                aria-disabled={page <= 1}
                className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), page <= 1 && 'pointer-events-none opacity-50')}
              >
                <ChevronRight className="size-4" aria-hidden="true" />
                السابق
              </Link>
              <span className="text-sm text-muted-foreground">{`صفحة ${page} من ${totalPages}`}</span>
              <Link
                href={pageHref(page + 1)}
                aria-disabled={page >= totalPages}
                className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), page >= totalPages && 'pointer-events-none opacity-50')}
              >
                التالي
                <ChevronLeft className="size-4" aria-hidden="true" />
              </Link>
            </nav>
          )}
        </>
      )}
    </div>
  )
}
