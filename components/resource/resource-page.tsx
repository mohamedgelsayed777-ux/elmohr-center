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
import { WorkOrderFormDialog } from '@/components/work-orders/work-order-form-dialog'
import { DeleteButton } from './delete-button'
import { RecordDateDialog } from './record-date-dialog'
import { EmployeePasswordDialog } from './employee-password-dialog'

const PAGE_SIZE = 20
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type SearchParams = Record<string, string | string[] | undefined>

function param(sp: SearchParams, key: string) {
  const v = sp[key]
  return (Array.isArray(v) ? v[0] : v)?.trim() ?? ''
}

function cairoDateTimeIso(year: number, month: number, day: number) {
  const noonUtc = new Date(Date.UTC(year, month - 1, day, 12))
  const zone = new Intl.DateTimeFormat('en', {
    timeZone: 'Africa/Cairo',
    timeZoneName: 'shortOffset',
  }).formatToParts(noonUtc).find((part) => part.type === 'timeZoneName')?.value ?? 'GMT+2'
  const match = zone.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/)
  const offsetMinutes = match
    ? (match[1] === '-' ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3] ?? 0))
    : 120
  return new Date(Date.UTC(year, month - 1, day) - offsetMinutes * 60000).toISOString()
}

function sanitizeSearch(q: string) {
  return q.replace(/[,()*%\\:"']/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80)
}

export async function ResourcePage({
  resourceKey,
  searchParams,
  headerActions,
  workOrderFormProps,
}: {
  resourceKey: ResourceKey
  searchParams: SearchParams
  headerActions?: React.ReactNode
  workOrderFormProps?: Omit<React.ComponentProps<typeof WorkOrderFormDialog>, 'record'>
}) {
  const resource = RESOURCES[resourceKey]
  const supabase = await createClient()
  const { data: roleData } = await supabase.rpc('current_user_role')
  const { data: employeeAccounts } = resourceKey === 'employees' && roleData === 'manager'
    ? await supabase.from('profiles').select('id, full_name, role, employee_code').in('role', ['reception', 'accountant']).order('full_name')
    : { data: [] as { id: string; full_name: string; role: string; employee_code: string | null }[] }
  const canEdit = !( ['accountant', 'reception'].includes(roleData ?? '') && ['attendance', 'services'].includes(resourceKey)) && !(roleData === 'reception' && resourceKey === 'parts')
  const canDelete = ['invoices', 'spare_part_requests'].includes(resourceKey)
    ? roleData === 'manager'
    : !(roleData === 'reception' && resourceKey === 'work_orders') && !(resourceKey === 'parts' && ['accountant', 'reception'].includes(roleData ?? ''))
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

  if (resourceKey === 'work_orders') {
    const selectedMonth = param(searchParams, 'month')
    const selectedPeriod = param(searchParams, 'period') || 'month'
    const now = new Date()
    const cairoDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(now)
    const [currentYear, currentMonth, currentDay] = cairoDate.split('-').map(Number)
    let startParts: [number, number, number] | null = null
    let endParts: [number, number, number] | null = null
    if (/^\d{4}-\d{2}$/.test(selectedMonth)) {
      const [y, m] = selectedMonth.split('-').map(Number)
      if (m >= 1 && m <= 12) {
        startParts = [y, m, 1]
        endParts = m === 12 ? [y + 1, 1, 1] : [y, m + 1, 1]
      }
    } else if (selectedPeriod === 'day') {
      startParts = [currentYear, currentMonth, currentDay]
      endParts = new Date(Date.UTC(currentYear, currentMonth - 1, currentDay + 1))
        .toISOString().slice(0, 10).split('-').map(Number) as [number, number, number]
    } else if (selectedPeriod === 'week') {
      const weekday = new Date(Date.UTC(currentYear, currentMonth - 1, currentDay)).getUTCDay()
      const daysSinceMonday = (weekday + 6) % 7
      const monday = new Date(Date.UTC(currentYear, currentMonth - 1, currentDay - daysSinceMonday))
      const sundayNext = new Date(monday.getTime() + 7 * 86400000)
      startParts = [monday.getUTCFullYear(), monday.getUTCMonth() + 1, monday.getUTCDate()]
      endParts = [sundayNext.getUTCFullYear(), sundayNext.getUTCMonth() + 1, sundayNext.getUTCDate()]
    } else if (selectedPeriod === 'month') {
      startParts = [currentYear, currentMonth, 1]
      endParts = currentMonth === 12 ? [currentYear + 1, 1, 1] : [currentYear, currentMonth + 1, 1]
    }
    if (startParts && endParts) {
      const toCairoIso = ([y, m, d]: [number, number, number]) => {
        const noonUtc = new Date(Date.UTC(y, m - 1, d, 12))
        const zone = new Intl.DateTimeFormat('en', { timeZone: 'Africa/Cairo', timeZoneName: 'shortOffset' })
          .formatToParts(noonUtc).find(part => part.type === 'timeZoneName')?.value ?? 'GMT+2'
        const match = zone.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/)
        const offsetMinutes = match ? (match[1] === '-' ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3] ?? 0)) : 120
        return new Date(Date.UTC(y, m - 1, d) - offsetMinutes * 60000).toISOString()
      }
      query = query.gte('opened_at', toCairoIso(startParts)).lt('opened_at', toCairoIso(endParts))
    }
  } else if (['attendance', 'invoices', 'expenses'].includes(resourceKey) && (year || month || day)) {
    const cairoNow = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date())
    const [cairoYear, cairoMonth] = cairoNow.split('-').map(Number)
    const selectedYear = /^\d{4}$/.test(year) ? Number(year) : cairoYear
    const selectedMonth = /^\d{2}$/.test(month) ? Number(month) : 0
    const selectedDay = /^\d{2}$/.test(day) ? Number(day) : 0
    const daysInSelectedMonth = selectedMonth >= 1 && selectedMonth <= 12
      ? new Date(Date.UTC(selectedYear, selectedMonth, 0)).getUTCDate()
      : 0
    let startParts: [number, number, number]
    let endParts: [number, number, number]
    if (selectedMonth >= 1 && selectedMonth <= 12 && selectedDay >= 1 && selectedDay <= daysInSelectedMonth) {
      startParts = [selectedYear, selectedMonth, selectedDay]
      const next = new Date(Date.UTC(selectedYear, selectedMonth - 1, selectedDay + 1))
      endParts = [next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate()]
    } else if (selectedMonth >= 1 && selectedMonth <= 12) {
      startParts = [selectedYear, selectedMonth, 1]
      endParts = selectedMonth === 12 ? [selectedYear + 1, 1, 1] : [selectedYear, selectedMonth + 1, 1]
    } else {
      startParts = [selectedYear, 1, 1]
      endParts = [selectedYear + 1, 1, 1]
    }
    const dateColumn = resourceKey === 'attendance' ? 'attendance_date' : resourceKey === 'expenses' ? 'expense_date' : 'issued_at'
    const dateOnly = resourceKey === 'attendance' || resourceKey === 'expenses'
    const start = dateOnly
      ? `${startParts[0]}-${String(startParts[1]).padStart(2, '0')}-${String(startParts[2]).padStart(2, '0')}`
      : cairoDateTimeIso(...startParts)
    const end = dateOnly
      ? `${endParts[0]}-${String(endParts[1]).padStart(2, '0')}-${String(endParts[2]).padStart(2, '0')}`
      : cairoDateTimeIso(...endParts)
    query = query.gte(dateColumn, start).lt(dateColumn, end)
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
          ? []
          : filter.options ?? []
    toolbarFilters.push({ name: filter.name, label: filter.label, options })
    const value = param(searchParams, filter.name)
    if (!value) continue
    // Apply the selected filter value directly to the database query.
    // Dropdown options are presentation data and must never decide whether a
    // supplied filter is applied (they may be incomplete or loaded separately).
    if (filter.relation) {
      if (UUID_RE.test(value)) query = query.eq(filter.name, value)
    } else {
      query = query.eq(filter.name, value)
    }
  }

  if (resourceKey === 'parts' && ['part', 'filter', 'oil'].includes(inventoryType)) {
    query = query.eq('inventory_type', inventoryType)
  }

  const [{ data, count, error }, relationOptions] = await Promise.all([
    query,
    loadRelationOptions(resource),
  ])
  for (const filter of toolbarFilters) {
    const definition = resource.filters.find((item) => item.name === filter.name)
    if (definition?.relation) filter.options = relationOptions[definition.relation] ?? []
  }
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

      {resourceKey === 'employees' && roleData === 'manager' && (employeeAccounts ?? []).length > 0 && (
        <section className="mb-5 rounded-lg border bg-card p-4">
          <h2 className="mb-1 font-semibold">إدارة كلمات مرور حسابات الموظفين</h2>
          <p className="mb-3 text-sm text-muted-foreground">اختر حساب الاستقبال أو المحاسب لتعيين كلمة مرور جديدة. هذه العملية لا تغير الصلاحيات.</p>
          <div className="flex flex-wrap gap-2">
            {(employeeAccounts ?? []).map((account) => (
              <EmployeePasswordDialog key={account.id} account={account} />
            ))}
          </div>
        </section>
      )}

      <ResourceToolbar
        searchPlaceholder={resource.searchPlaceholder}
        filters={toolbarFilters}
        dateFilter={['attendance', 'invoices', 'expenses'].includes(resourceKey) ? { enabled: true, year, month, day } : undefined}
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
                    {roleData === 'manager' && resourceKey === 'work_orders' && <RecordDateDialog resourceKey="work_orders" recordId={String(row.id)} currentDate={String(row.opened_at ?? '')} label="تاريخ أمر العمل" />}
                        {roleData === 'manager' && resourceKey === 'invoices' && <RecordDateDialog resourceKey="invoices" recordId={String(row.id)} currentDate={String(row.issued_at ?? '')} label="تاريخ الفاتورة" />}
                        {resourceKey === 'invoices' && <Link href={`/invoices/${String(row.id)}/print`} target="_blank" aria-label="طباعة الفاتورة" className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }))}><Printer className="size-4" /></Link>}
                    {canEdit && (
                      resourceKey === 'work_orders' && workOrderFormProps ? (
                        <WorkOrderFormDialog {...workOrderFormProps} record={row as unknown as {id:string;[key:string]:unknown}} />
                      ) : (
                        <ResourceFormDialog
                          resourceKey={resource.key}
                          singular={resource.singular}
                          fields={resource.fields}
                          relationOptions={relationOptions}
                          record={row}
                          inventoryType={resourceKey === 'parts' && ['part', 'filter', 'oil'].includes(inventoryType) ? inventoryType as 'part' | 'filter' | 'oil' : undefined}
                        />
                      )
                    )}
                    {canDelete && <DeleteButton resourceKey={resource.key} id={String(row.id)} singular={resource.singular} />}
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
                        {roleData === 'manager' && resourceKey === 'work_orders' && <RecordDateDialog resourceKey="work_orders" recordId={String(row.id)} currentDate={String(row.opened_at ?? '')} label="تاريخ أمر العمل" />}
                        {roleData === 'manager' && resourceKey === 'invoices' && <RecordDateDialog resourceKey="invoices" recordId={String(row.id)} currentDate={String(row.issued_at ?? '')} label="تاريخ الفاتورة" />}
                        {resourceKey === 'invoices' && <Link href={`/invoices/${String(row.id)}/print`} target="_blank" aria-label="طباعة الفاتورة" className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }))}><Printer className="size-4" /></Link>}
                        {canEdit && (
                          resourceKey === 'work_orders' && workOrderFormProps ? (
                            <WorkOrderFormDialog {...workOrderFormProps} record={row as unknown as {id:string;[key:string]:unknown}} />
                          ) : (
                            <ResourceFormDialog
                              resourceKey={resource.key}
                              singular={resource.singular}
                              fields={resource.fields}
                              relationOptions={relationOptions}
                              record={row}
                              inventoryType={resourceKey === 'parts' && ['part', 'filter', 'oil'].includes(inventoryType) ? inventoryType as 'part' | 'filter' | 'oil' : undefined}
                            />
                          )
                        )}
                        {canDelete && <DeleteButton resourceKey={resource.key} id={String(row.id)} singular={resource.singular} />}
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
