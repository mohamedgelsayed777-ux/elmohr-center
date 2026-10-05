import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatNumber } from '@/lib/format'
import { PageHeader } from '@/components/app/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function sum(rows: any[] | null | undefined, key: string) {
  return (rows ?? []).reduce((total, row) => total + Number(row?.[key] ?? 0), 0)
}

export default async function ReportsPage() {
  const supabase = await createClient()
  const [{ data: invoices }, { data: expenses }, { data: orders }] = await Promise.all([
    supabase.from('invoices').select('total, paid_amount, status'),
    supabase.from('expenses').select('amount'),
    supabase.from('work_orders').select('status'),
  ])

  const invoiceTotal = sum(invoices, 'total')
  const paidTotal = sum(invoices, 'paid_amount')
  const expenseTotal = sum(expenses, 'amount')
  const outstanding = Math.max(0, invoiceTotal - paidTotal)
  const completed = (orders ?? []).filter((o) => o.status === 'completed' || o.status === 'delivered').length
  const open = Math.max(0, (orders?.length ?? 0) - completed)

  const cards = [
    ['إجمالي الفواتير', formatCurrency(invoiceTotal)],
    ['المحصل', formatCurrency(paidTotal)],
    ['المتبقي', formatCurrency(outstanding)],
    ['إجمالي المصروفات', formatCurrency(expenseTotal)],
    ['أوامر مكتملة', formatNumber(completed)],
    ['أوامر مفتوحة', formatNumber(open)],
  ]

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <PageHeader title="التقارير" description="ملخص مالي وتشغيلي من البيانات الحالية" />
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {cards.map(([title, value]) => (
          <Card key={title}><CardHeader><CardTitle className="text-sm text-muted-foreground">{title}</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{value}</p></CardContent></Card>
        ))}
      </section>
      <Card>
        <CardHeader><CardTitle>ملخص</CardTitle></CardHeader>
        <CardContent className="text-sm leading-7 text-muted-foreground">
          هذه نسخة أولية من التقارير تعتمد على البيانات الموجودة في Supabase. بعد تشغيل النظام سنضيف تقارير شهرية، حسب الفرع، حسب الفني، وأرباح أوامر العمل.
        </CardContent>
      </Card>
    </div>
  )
}
