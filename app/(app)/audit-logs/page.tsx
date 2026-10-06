
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type AuditRow = { id: string; user_id: string | null; action: 'INSERT' | 'UPDATE' | 'DELETE'; table_name: string; record_id: string | null; occurred_at: string; full_name: string; role: string | null }
const TABLE_LABELS: Record<string, string> = { customers:'العملاء', cars:'السيارات', work_orders:'أوامر العمل', invoices:'الفواتير', invoice_items:'بنود الفواتير', parts:'المخزون', services:'الخدمات', expenses:'المصروفات', attendance:'الحضور', employees:'الموظفون', branches:'الفروع' }
const ACTION_LABELS = { INSERT:'إضافة', UPDATE:'تعديل', DELETE:'حذف' } as const
const roleLabel = (role?: string | null) => role === 'manager' ? 'المدير' : role === 'accountant' ? 'المحاسب' : 'الاستقبال'

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => { (async () => {
    const supabase = createClient()
    const { data, error } = await supabase.rpc('get_audit_logs', { limit_count: 200 })
    if (error) setError(error.message)
    else setLogs((data ?? []) as AuditRow[])
    setLoading(false)
  })() }, [])
  return <div className="mx-auto flex max-w-7xl flex-col">
    <div className="mb-5"><h1 className="text-2xl font-bold">سجل العمليات</h1><p className="mt-1 text-muted-foreground">كل إضافة أو تعديل أو حذف ومن قام بها ووقت تنفيذها</p></div>
    {loading ? <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">جاري تحميل سجل العمليات...</div> : error ? <div className="rounded-lg border border-destructive/40 bg-card p-8 text-center text-destructive">تعذر تحميل سجل العمليات: {error}</div> : logs.length === 0 ? <div className="rounded-lg border border-dashed bg-card p-10 text-center text-muted-foreground">لا توجد عمليات مسجلة حتى الآن</div> : <div className="overflow-x-auto rounded-lg border bg-card"><table className="w-full text-sm"><thead className="border-b bg-muted/50"><tr><th className="px-4 py-3 text-start">التاريخ والوقت</th><th className="px-4 py-3 text-start">الحساب</th><th className="px-4 py-3 text-start">العملية</th><th className="px-4 py-3 text-start">القسم</th><th className="px-4 py-3 text-start">رقم السجل</th></tr></thead><tbody className="divide-y">{logs.map(log => <tr key={log.id} className="hover:bg-muted/40"><td className="whitespace-nowrap px-4 py-3">{new Intl.DateTimeFormat('ar-EG-u-nu-latn',{dateStyle:'short',timeStyle:'short'}).format(new Date(log.occurred_at))}</td><td className="px-4 py-3 font-medium">{log.full_name}{log.role && <span className="mr-2 text-xs text-muted-foreground">({roleLabel(log.role)})</span>}</td><td className="px-4 py-3">{ACTION_LABELS[log.action]}</td><td className="px-4 py-3">{TABLE_LABELS[log.table_name] ?? log.table_name}</td><td className="px-4 py-3 font-mono text-xs text-muted-foreground">{log.record_id ?? '—'}</td></tr>)}</tbody></table></div>}
  </div>
}
