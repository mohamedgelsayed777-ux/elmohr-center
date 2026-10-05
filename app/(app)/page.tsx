import Link from 'next/link'
import { Car, ClipboardList, FileText, Users, Wallet, ArrowLeft, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate, formatNumber } from '@/lib/format'
import { PageHeader } from '@/components/app/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

async function countRows(supabase: Awaited<ReturnType<typeof createClient>>, table: string) {
  const { count, error } = await supabase.from(table).select('id', { count: 'exact', head: true })
  return error ? 0 : count ?? 0
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const [customers, cars, workOrders, invoices, expenses] = await Promise.all([
    countRows(supabase, 'customers'),
    countRows(supabase, 'cars'),
    countRows(supabase, 'work_orders'),
    countRows(supabase, 'invoices'),
    countRows(supabase, 'expenses'),
  ])

  const { data: recentOrders } = await supabase
    .from('work_orders')
    .select('id, order_number, status, total_amount, opened_at, customer:customers(full_name), car:cars(plate_number, make, model)')
    .order('opened_at', { ascending: false })
    .limit(5)

  const stats = [
    { label: 'العملاء', value: customers, icon: Users, href: '/customers' },
    { label: 'السيارات', value: cars, icon: Car, href: '/cars' },
    { label: 'أوامر العمل', value: workOrders, icon: ClipboardList, href: '/work-orders' },
    { label: 'الفواتير', value: invoices, icon: FileText, href: '/invoices' },
    { label: 'المصروفات', value: expenses, icon: Wallet, href: '/expenses' },
  ]

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <PageHeader title="لوحة التحكم" description="نظرة سريعة على نشاط مركز المهر" actions={<Link href="/work-orders" className={cn(buttonVariants())}><Plus className="size-4" /> أمر عمل جديد</Link>} />

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href} className="group">
            <Card className="h-full transition-colors group-hover:bg-muted/40">
              <CardContent className="flex flex-col gap-3 p-4">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="size-5" /></div>
                <div><p className="text-2xl font-bold">{formatNumber(value)}</p><p className="text-xs text-muted-foreground">{label}</p></div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 border-b">
          <CardTitle>آخر أوامر العمل</CardTitle>
          <Link href="/work-orders" className="text-sm font-medium text-primary">عرض الكل <ArrowLeft className="inline size-4" /></Link>
        </CardHeader>
        <CardContent className="p-0">
          {!recentOrders?.length ? (
            <div className="p-8 text-center text-sm text-muted-foreground">لا توجد أوامر عمل حتى الآن.</div>
          ) : (
            <div className="divide-y">
              {recentOrders.map((order: any) => (
                <div key={order.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">#{order.order_number ?? '—'} · {order.customer?.full_name ?? 'بدون عميل'}</p>
                    <p className="text-sm text-muted-foreground">{order.car?.plate_number ?? 'بدون لوحة'} · {formatDate(order.opened_at)}</p>
                  </div>
                  <div className="text-sm font-semibold">{formatCurrency(order.total_amount)}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
