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

  const { data: { session } } = await supabase.auth.getSession()
  let items: Array<{ item_type?: string | null; description?: string | null; quantity?: number | string | null; unit_price?: number | string | null; total?: number | string | null }> = []

  if (session?.access_token) {
    const response = await fetch('https://ymalhqxqvftmhujuamxv.supabase.co/functions/v1/invoice-print-details', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ invoice_id: id }),
      cache: 'no-store',
    })
    if (response.ok) {
      const result = await response.json()
      items = Array.isArray(result.items) ? result.items : []
    }
  }

  return <PrintInvoice invoice={invoice} items={items} />
}
