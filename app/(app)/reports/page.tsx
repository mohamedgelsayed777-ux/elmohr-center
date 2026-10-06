import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatNumber } from '@/lib/format'
import { PageHeader } from '@/components/app/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function sum(rows:any[]|null|undefined,key:string){return(rows??[]).reduce((t,r)=>t+Number(r?.[key]??0),0)}
function range(period:string){
 const now=new Date(), start=new Date(now)
 if(period==='day') start.setHours(0,0,0,0)
 else if(period==='month') start.setDate(1),start.setHours(0,0,0,0)
 else start.setMonth(0,1),start.setHours(0,0,0,0)
 const end=new Date(start)
 if(period==='day') end.setDate(end.getDate()+1)
 else if(period==='month') end.setMonth(end.getMonth()+1)
 else end.setFullYear(end.getFullYear()+1)
 return {start:start.toISOString(),end:end.toISOString(),label:period==='day'?'اليوم':period==='month'?'هذا الشهر':'هذه السنة'}
}
export default async function ReportsPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const sp=await searchParams; const raw=Array.isArray(sp.period)?sp.period[0]:sp.period; const period=raw==='day'||raw==='year'?'year':raw==='month'?'month':'day'; const r=range(period); const supabase=await createClient()
 const [ir,er,or]=await Promise.all([
  supabase.from('invoices').select('total,paid_amount').gte('issued_at',r.start).lt('issued_at',r.end),
  supabase.from('expenses').select('amount').gte('expense_date',r.start.slice(0,10)).lt('expense_date',r.end.slice(0,10)),
  supabase.from('work_orders').select('status').gte('opened_at',r.start).lt('opened_at',r.end)
 ])
 const invoiceTotal=sum(ir.data,'total'),paidTotal=sum(ir.data,'paid_amount'),expenseTotal=sum(er.data,'amount'),outstanding=Math.max(0,invoiceTotal-paidTotal)
 const completed=(or.data??[]).filter(o=>o.status==='completed'||o.status==='delivered').length, open=Math.max(0,(or.data?.length??0)-completed)
 const cards=[['إجمالي الفواتير',formatCurrency(invoiceTotal)],['المحصل',formatCurrency(paidTotal)],['المتبقي',formatCurrency(outstanding)],['إجمالي المصروفات',formatCurrency(expenseTotal)],['صافي بعد المصروفات',formatCurrency(paidTotal-expenseTotal)],['أوامر مكتملة',formatNumber(completed)],['أوامر مفتوحة',formatNumber(open)]]
 return <div className="mx-auto flex max-w-7xl flex-col gap-6"><PageHeader title="التقارير" description={'تقارير '+r.label+' المالية والتشغيلية بالجنيه المصري'}/><div className="flex flex-wrap gap-2">{(['day','month','year'] as const).map(p=><Link key={p} href={'/reports?period='+p} className={`rounded-md border px-4 py-2 ${period===p?'bg-primary text-primary-foreground':''}`}>{p==='day'?'اليوم':p==='month'?'هذا الشهر':'هذه السنة'}</Link>)}</div><section className="grid grid-cols-2 gap-3 md:grid-cols-4">{cards.map(([t,v])=><Card key={t}><CardHeader><CardTitle className="text-sm text-muted-foreground">{t}</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{v}</p></CardContent></Card>)}</section><Card><CardHeader><CardTitle>ملخص الفترة</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">جميع القيم المالية بالجنيه المصري، والحسابات مقتصرة على الفترة المحددة.</CardContent></Card></div>
}