import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PrintInvoice } from '@/components/invoices/print-invoice'

export default async function PrintInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: invoice } = await supabase
    .from('invoices')
    .select('id, invoice_number, subtotal, discount, tax, total, paid_amount, status, payment_method, issued_at, customer:customers(full_name, phone), branch:branches(name), work_order:work_orders(order_number)')
    .eq('id', id)
    .maybeSingle()
  if (!invoice) notFound()

  const { data: items } = await supabase
    .from('invoice_items')
    .select('item_type, description, quantity, unit_price, total')
    .eq('invoice_id', id)

  return <PrintInvoice invoice={invoice} items={items ?? []} />
}
