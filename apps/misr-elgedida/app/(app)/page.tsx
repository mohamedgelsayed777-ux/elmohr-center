import Link from 'next/link'
import { Car, ClipboardList, FileText, Users, Wallet, ArrowLeft, Plus, Package, Filter, Droplets, ClipboardCheck, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate, formatNumber } from '@/lib/format'
import { PageHeader } from '@/components/app/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Period = 'day' | 'week' | 'month'

function getPeriodRange(period: Period) {
  const now = new Date()
  const start = new Date(now)
  if (period === 'day') start.setHours(0, 0, 0, 0)
  else if (period === 'week') { const day = start.getDay(); const diff = day === 0 ? 6 : day - 1; start.setDate(start.getDate() - diff); start.setHours(0, 0, 0, 0) }
  else { start.setDate(1); start.setHours(0, 0, 0, 0) }
  const end = new Date(start)
  if (period === 'day') end.setDate(end.getDate() + 1)
  else if (period === 'week') end.setDate(end.getDate() + 7)
  else end.setMonth(end.getMonth() + 1)
  return { start: start.toISOString(), end: end.toISOString() }
}

async function countRows(supabase: Awaited<ReturnType<typeof createClient>>, table: string, dateColumn?: string, range?: { start: string; end: string }) {
  let query = supabase.from(table).select('id', { count: 'exact', head: true })
  if (dateColumn && range) query = query.gte(dateColumn, range.start).lt(dateColumn, range.end)
  const { count, error } = await query
  return error ? 0 : count ?? 0
}

export default async function DashboardPage({ searchParams }: PageProps<'/'>) {
  const supabase = await createClient()
  const params = await searchParams
  const requested = params.period
  const period: Period = requested === 'day' || requested === 'week' ? requested : 'month'
  const range = getPeriodRange(period)

  const [customers, cars, workOrders, invoices, revenueRows, expenseRows, partsStock, filtersStock, oilsStock, attendanceToday] = await Promise.all([
    countRows(supabase, 'customers', 'created_at', range),
    countRows(supabase, 'cars', 'created_at', range),
    countRows(supabase, 'work_orders', 'opened_at', range),
    countRows(supabase, 'invoices', 'issued_at', range),
    supabase.from('invoices').select('total, paid_amount').gte('issued_at', range.start).lt('issued_at', range.end),
    supabase.from('expenses').select('amount').gte('expense_date', range.start.slice(0, 10)).lt('expense_date', range.end.slice(0, 10)),
    supabase.from('parts').select('id', { count: 'exact', head: true }).eq('inventory_type', 'part').then(r => r.count ?? 0),
    supabase.from('parts').select('id', { count: 'exact', head: true }).eq('inventory_type', 'filter').then(r => r.count ?? 0),
    supabase.from('parts').select('id', { count: 'exact', head: true }).eq('inventory_type', 'oil').then(r => r.count ?? 0),
    supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('attendance_date', new Date().toISOString().slice(0, 10)).then(r => r.count ?? 0),
  ])

  const revenue = (revenueRows.data ?? []).reduce((sum, row) => sum + Number(row.paid_amount ?? row.total ?? 0), 0)
  const expensesTotal = (expenseRows.data ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0)
  const { data: recentOrders } = await supabase.from('work_orders').select('id, order_number, status, total_amount, opened_at, customer:customers(full_name), car:cars(plate_number, make, model)').order('opened_at', { ascending: false }).limit(5)
  const periodLabels = { day: 'اليوم', week: 'هذا الأسبوع', month: 'هذا الشهر' }
  const stats = [
    { label: 'عملاء جدد', value: customers, icon: Users, href: '/customers' },
    { label: 'سيارات جديدة', value: cars, icon: Car, href: '/cars' },
    { label: 'أوامر العمل', value: workOrders, icon: ClipboardList, href: '/work-orders' },
    { label: 'الفواتير', value: invoices, icon: FileText, href: '/invoices' },
    { label: 'الإيرادات المحصلة', value: formatCurrency(revenue), icon: TrendingUp, href: '/invoices' },
    { label: 'المصروفات', value: formatCurrency(expensesTotal), icon: Wallet, href: '/expenses' },
    { label: 'مخزن قطع الغيار', value: partsStock, icon: Package, href: '/parts?inventory_type=part' },
    { label: 'مخزن الفلاتر', value: filtersStock, icon: Filter, href: '/parts?inventory_type=filter' },
    { label: 'مخزن الزيوت', value: oilsStock, icon: Droplets, href: '/parts?inventory_type=oil' },
    { label: 'حضور اليوم', value: attendanceToday, icon: ClipboardCheck, href: '/attendance' },
  ]
  return (<div className="mx-auto flex max-w-7xl flex-col gap-6">
    <PageHeader title="لوحة التحكم" description={"إحصائيات " + periodLabels[period] + " في مركز المهر"} actions={<Link href="/work-orders" className={cn(buttonVariants())}><Plus className="size-4" /> أمر عمل جديد</Link>} />
    <div className="flex flex-wrap gap-2">{(['day', 'week', 'month'] as Period[]).map((item) => <Link key={item} href={'/?period=' + item} className={cn(buttonVariants({ variant: period === item ? 'default' : 'outline', size: 'sm' }))}>{periodLabels[item]}</Link>)}</div>
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{stats.map(({ label, value, icon: Icon, href }) => <Link key={label} href={href} className="group"><Card className="h-full transition-colors group-hover:bg-muted/40"><CardContent className="flex flex-col gap-3 p-4"><div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="size-5" /></div><div><p className="text-2xl font-bold">{typeof value === 'number' ? formatNumber(value) : value}</p><p className="text-xs text-muted-foreground">{label}</p></div></CardContent></Card></Link>)}</section>
    <Card><CardHeader className="flex flex-row items-center justify-between gap-3 border-b"><CardTitle>آخر أوامر العمل</CardTitle><Link href="/work-orders" className="text-sm font-medium text-primary">عرض الكل <ArrowLeft className="inline size-4" /></Link></CardHeader><CardContent className="p-0">{!recentOrders?.length ? <div className="p-8 text-center text-sm text-muted-foreground">لا توجد أوامر عمل حتى الآن.</div> : <div className="divide-y">{recentOrders.map((order: any) => <div key={order.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">#{order.order_number ?? '—'} · {order.customer?.full_name ?? 'بدون عميل'}</p><p className="text-sm text-muted-foreground">{order.car?.plate_number ?? 'بدون لوحة'} · {formatDate(order.opened_at)}</p></div><div className="text-sm font-semibold">{formatCurrency(order.total_amount)}</div></div>)}</div>}</CardContent></Card>
  </div>)
}