import type { Metadata } from 'next'
import Link from 'next/link'
import { Search, UserRound, Car, ClipboardList, ReceiptText } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'البحث الشامل' }

export default async function SearchPage({ searchParams }: PageProps<'/search'>) {
  const sp = await searchParams
  const q = typeof sp.q === 'string' ? sp.q.trim().slice(0, 80) : ''
  const supabase = await createClient()
  let customers:any[] = [], cars:any[] = [], orders:any[] = [], invoices:any[] = []
  if (q) {
    const n = /^\d+$/.test(q)
    const [a,b,c,d] = await Promise.all([
      supabase.from('customers').select('id,customer_number,full_name,phone').or(`full_name.ilike.*${q}*,phone.ilike.*${q}*`).limit(10),
      supabase.from('cars').select('id,make,model,plate_number,customer:customers(full_name)').or(`plate_number.ilike.*${q}*,make.ilike.*${q}*,model.ilike.*${q}*,vin.ilike.*${q}*`).limit(10),
      n ? supabase.from('work_orders').select('id,order_number,customer:customers(full_name),car:cars(plate_number,make,model)').eq('order_number',Number(q)).limit(10) : Promise.resolve({data:[]}),
      n ? supabase.from('invoices').select('id,invoice_number,total,customer:customers(full_name)').eq('invoice_number',Number(q)).limit(10) : Promise.resolve({data:[]})
    ])
    customers=a.data??[]; cars=b.data??[]; orders=c.data??[]; invoices=d.data??[]
  }
  return <div className="mx-auto max-w-5xl space-y-5">
    <div><h1 className="flex items-center gap-2 text-2xl font-bold"><Search className="size-6"/>البحث الشامل</h1><p className="mt-1 text-muted-foreground">عميل، سيارة، أمر شغل أو فاتورة</p></div>
    <form method="get" className="flex gap-2"><Input name="q" defaultValue={q} autoFocus placeholder="اكتب اسم العميل أو رقم التليفون أو اللوحة أو رقم الأمر أو الفاتورة"/><Button type="submit"><Search className="size-4"/>بحث</Button></form>
    {q && !customers.length && !cars.length && !orders.length && !invoices.length && <div className="rounded-xl border p-8 text-center text-muted-foreground">لا توجد نتائج مطابقة</div>}
    <div className="grid gap-4 md:grid-cols-2">
      <Box title="العملاء" icon={<UserRound/>} rows={customers.map(x=>({href:'/customers?q='+encodeURIComponent(x.full_name),title:x.full_name,meta:x.phone||''}))}/>
      <Box title="السيارات" icon={<Car/>} rows={cars.map(x=>({href:'/cars?q='+encodeURIComponent(x.plate_number||x.make),title:[x.make,x.model,x.plate_number].filter(Boolean).join(' — '),meta:x.customer?.full_name?'المالك: '+x.customer.full_name:''}))}/>
      <Box title="أوامر الشغل" icon={<ClipboardList/>} rows={orders.map(x=>({href:'/work-orders?q='+x.order_number,title:'أمر شغل #'+x.order_number,meta:x.customer?.full_name||''}))}/>
      <Box title="الفواتير" icon={<ReceiptText/>} rows={invoices.map(x=>({href:'/invoices?q='+x.invoice_number,title:'فاتورة #'+x.invoice_number,meta:x.customer?.full_name||''}))}/>
    </div>
  </div>
}
function Box({title,icon,rows}:{title:string;icon:React.ReactNode;rows:{href:string;title:string;meta:string}[]}) {
 if(!rows.length)return null
 return <section className="rounded-xl border bg-card p-4"><h2 className="mb-3 flex items-center gap-2 font-semibold">{icon}{title}</h2><div className="space-y-2">{rows.map((r,i)=><Link key={i} href={r.href} className="block rounded-lg border p-3 hover:bg-muted/50"><div className="font-medium">{r.title}</div>{r.meta&&<div className="text-sm text-muted-foreground">{r.meta}</div>}</Link>)}</div></section>
}