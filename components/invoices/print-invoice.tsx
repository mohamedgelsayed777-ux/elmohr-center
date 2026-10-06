'use client'

import { useEffect } from 'react'

export function PrintInvoice({ invoice, items }: { invoice: any; items: any[] }) {
  useEffect(() => {
    const timer = window.setTimeout(() => window.print(), 300)
    return () => window.clearTimeout(timer)
  }, [])

  const customer = Array.isArray(invoice.customer) ? invoice.customer[0] : invoice.customer
  const branch = Array.isArray(invoice.branch) ? invoice.branch[0] : invoice.branch
  const workOrder = Array.isArray(invoice.work_order) ? invoice.work_order[0] : invoice.work_order
  const payment = ({ cash: 'نقدي', instapay: 'إنستاباي', wallet: 'محفظة', visa: 'فيزا' } as Record<string,string>)[invoice.payment_method] ?? '-'

  return (
    <main dir="rtl" className="mx-auto min-h-screen max-w-3xl bg-white p-6 text-black print:max-w-none print:p-0">
      <div className="mb-6 flex items-start justify-between border-b-2 pb-4">
        <div>
          <h1 className="text-2xl font-bold">مركز المهر</h1>
          <p className="text-sm">ELMOHR CENTER</p>
          <p className="mt-1 text-sm">كل ما يخص عالم السيارات</p>
        </div>
        <div className="text-left text-sm">
          <div className="text-xl font-bold">فاتورة #{invoice.invoice_number}</div>
          <div>{new Date(invoice.issued_at).toLocaleDateString('ar-EG')}</div>
        </div>
      </div>
      <section className="mb-5 grid grid-cols-2 gap-3 rounded-lg border p-4 text-sm">
        <div><b>العميل:</b> {customer?.full_name ?? '-'}</div>
        <div><b>الهاتف:</b> {customer?.phone ?? '-'}</div>
        <div><b>الفرع:</b> {branch?.name ?? '-'}</div>
        <div><b>أمر العمل:</b> {workOrder?.order_number ? ('#' + workOrder.order_number) : '-'}</div>
      </section>
      <table className="mb-5 w-full border-collapse text-sm">
        <thead><tr className="border-b-2"><th className="p-2 text-right">البيان</th><th className="p-2">الكمية</th><th className="p-2">السعر</th><th className="p-2">الإجمالي</th></tr></thead>
        <tbody>{items.map((item, i) => <tr key={i} className="border-b"><td className="p-2">{item.description ?? '-'}</td><td className="p-2 text-center">{item.quantity}</td><td className="p-2 text-center">{Number(item.unit_price ?? 0).toFixed(2)}</td><td className="p-2 text-center">{Number(item.total ?? 0).toFixed(2)}</td></tr>)}</tbody>
      </table>
      <div className="mr-auto w-72 space-y-2 text-sm">
        <div className="flex justify-between"><span>قبل الخصم</span><b>{Number(invoice.subtotal).toFixed(2)}</b></div>
        <div className="flex justify-between"><span>الخصم</span><b>{Number(invoice.discount).toFixed(2)}</b></div>
        <div className="flex justify-between"><span>الضريبة</span><b>{Number(invoice.tax).toFixed(2)}</b></div>
        <div className="flex justify-between border-t-2 pt-2 text-lg"><span>الإجمالي</span><b>{Number(invoice.total).toFixed(2)} جنيه</b></div>
        <div className="flex justify-between"><span>المدفوع</span><b>{Number(invoice.paid_amount).toFixed(2)}</b></div>
        <div className="flex justify-between"><span>طريقة الدفع</span><b>{payment}</b></div>
      </div>
      <p className="mt-10 border-t pt-4 text-center text-xs">شكراً لثقتكم في مركز المهر</p>
      <div className="mt-5 flex justify-center print:hidden"><button onClick={() => window.print()} className="rounded-md border px-5 py-2 text-sm font-medium">طباعة الفاتورة مرة أخرى</button></div>
    </main>
  )
}
