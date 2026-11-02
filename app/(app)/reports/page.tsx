import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatNumber } from '@/lib/format'
import { PageHeader } from '@/components/app/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ResourceToolbar } from '@/components/resource/resource-toolbar'

function sum(rows: any[] | null | undefined, key: string) {
  return (rows ?? []).reduce((t, r) => t + Number(r?.[key] ?? 0), 0)
}

function buildRange(year: string, month: string, day: string) {
  const now = new Date()
  const selectedYear = /^\d{4}$/.test(year) ? Number(year) : now.getFullYear()
  const selectedMonth = /^\d{2}$/.test(month) ? Number(month) : 0
  const selectedDay = /^\d{2}$/.test(day) ? Number(day) : 0
  const daysInMonth = selectedMonth >= 1 && selectedMonth <= 12
    ? new Date(selectedYear, selectedMonth, 0).getDate()
    : 0

  let start: Date
  let end: Date
  if (selectedMonth >= 1 && selectedMonth <= 12 && selectedDay >= 1 && selectedDay <= daysInMonth) {
    start = new Date(selectedYear, selectedMonth - 1, selectedDay)
    end = new Date(selectedYear, selectedMonth - 1, selectedDay + 1)
  } else if (selectedMonth >= 1 && selectedMonth <= 12) {
    start = new Date(selectedYear, selectedMonth - 1, 1)
    end = new Date(selectedYear, selectedMonth, 1)
  } else {
    start = new Date(selectedYear, 0, 1)
    end = new Date(selectedYear + 1, 0, 1)
  }

  return {
    start: start.toISOString(),
    end: end.toISOString(),
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
    label: selectedDay && selectedMonth
      ? `يوم ${String(selectedDay).padStart(2, '0')}/${String(selectedMonth).padStart(2, '0')}/${selectedYear}`
      : selectedMonth
        ? `شهر ${String(selectedMonth).padStart(2, '0')}/${selectedYear}`
        : `سنة ${selectedYear}`,
  }
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const year = Array.isArray(sp.year) ? sp.year[0] ?? '' : sp.year ?? ''
  const month = Array.isArray(sp.month) ? sp.month[0] ?? '' : sp.month ?? ''
  const day = Array.isArray(sp.day) ? sp.day[0] ?? '' : sp.day ?? ''
  const r = buildRange(year, month, day)
  const supabase = await createClient()

  const [ir, er, or] = await Promise.all([
    supabase.from('invoices').select('id,total,paid_amount,discount').gte('issued_at', r.start).lt('issued_at', r.end),
    supabase.from('expenses').select('amount').gte('expense_date', r.startDate).lt('expense_date', r.endDate),
    supabase.from('work_orders').select('status').gte('opened_at', r.start).lt('opened_at', r.end),
  ])

  const invoiceIds = (ir.data ?? []).map((invoice) => invoice.id)
  const { data: itemRows, error: itemRowsError } = invoiceIds.length
    ? await supabase.from('invoice_items').select('item_type,part_id,total').in('invoice_id', invoiceIds)
    : { data: [], error: null }

  const invoiceTotal = sum(ir.data, 'total')
  const paidTotal = sum(ir.data, 'paid_amount')
  const discountTotal = sum(ir.data, 'discount')
  const expenseTotal = sum(er.data, 'amount')
  const outstanding = Math.max(0, invoiceTotal - paidTotal)
  const completed = (or.data ?? []).filter((o) => o.status === 'completed' || o.status === 'delivered').length
  const open = Math.max(0, (or.data?.length ?? 0) - completed)

  const breakdown = [
    { title: 'قطع غيار من المخزن', amount: sum((itemRows ?? []).filter((item) => item.item_type === 'part' && item.part_id), 'total') },
    { title: 'الزيوت', amount: sum((itemRows ?? []).filter((item) => item.item_type === 'oil'), 'total') },
    { title: 'الفلاتر', amount: sum((itemRows ?? []).filter((item) => item.item_type === 'filter'), 'total') },
    { title: 'المصنعيات', amount: sum((itemRows ?? []).filter((item) => item.item_type === 'labor'), 'total') },
    { title: 'قطع غيار مشتراة خارج المخزن', amount: sum((itemRows ?? []).filter((item) => item.item_type === 'part' && !item.part_id), 'total') },
  ]

  const cards = [
    ['إجمالي الفواتير', formatCurrency(invoiceTotal)],
    ['إجمالي الخصومات', formatCurrency(discountTotal)],
    ['المحصل', formatCurrency(paidTotal)],
    ['المتبقي', formatCurrency(outstanding)],
    ['إجمالي المصروفات', formatCurrency(expenseTotal)],
    ['صافي بعد المصروفات', formatCurrency(paidTotal - expenseTotal)],
    ['أوامر مكتملة', formatNumber(completed)],
    ['أوامر مفتوحة', formatNumber(open)],
  ]

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <PageHeader title="التقارير" description={`تقارير ${r.label} المالية والتشغيلية بالجنيه المصري`} />

      <ResourceToolbar
        filters={[]}
        dateFilter={{ enabled: true, year, month, day }}
      />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map(([title, value]) => (
          <Card key={title}>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>تفصيل الإيرادات حسب البند</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {itemRowsError ? (
            <p role="alert" className="text-sm text-destructive">تعذر تحميل تفصيل بنود الفواتير لهذه الفترة.</p>
          ) : (
            <>
              {breakdown.map((item) => (
                <div key={item.title} className="flex items-center justify-between gap-4 border-b pb-3 last:border-0 last:pb-0">
                  <span className="text-sm">{item.title}</span>
                  <span className="font-semibold tabular-nums">{formatCurrency(item.amount)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between gap-4 border-t pt-3 font-bold">
                <span>إجمالي البنود المفصلة</span>
                <span className="tabular-nums">{formatCurrency(breakdown.reduce((total, item) => total + item.amount, 0))}</span>
              </div>
              <div className="flex items-center justify-between gap-4 border-b pb-3">
                <span className="text-sm">إجمالي الخصومات</span>
                <span className="font-semibold tabular-nums">{formatCurrency(discountTotal)}</span>
              </div>
              <div className="flex items-center justify-between gap-4 font-bold">
                <span>صافي تفصيل الإيرادات بعد الخصومات</span>
                <span className="tabular-nums">{formatCurrency(breakdown.reduce((total, item) => total + item.amount, 0) - discountTotal)}</span>
              </div>
              <p className="text-xs text-muted-foreground">التفصيل مبني على بنود الفواتير في الفترة المختارة. قطع الغيار المشتراة خارج المخزن هي البنود المسجلة كقطع غيار بدون ربط بصنف مخزني.</p>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ملخص الفترة</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          جميع القيم المالية بالجنيه المصري، والحسابات مقتصرة على الفترة المحددة. تفصيل البنود يعرض قيمة المبيعات بالفواتير، بينما بطاقة «المحصل» تعرض المبالغ المسجلة كمدفوعة.
        </CardContent>
      </Card>
    </div>
  )
}
