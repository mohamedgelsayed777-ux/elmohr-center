'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type AuditRow = {
  id: string
  user_id: string | null
  action: 'INSERT' | 'UPDATE' | 'DELETE'
  table_name: string
  record_id: string | null
  occurred_at: string
}

type Profile = { id: string; full_name: string; role: string }

const TABLE_LABELS: Record<string, string> = {
  customers: 'العملاء',
  cars: 'السيارات',
  work_orders: 'أوامر العمل',
  invoices: 'الفواتير',
  invoice_items: 'بنود الفواتير',
  parts: 'المخزون',
  services: 'الخدمات',
  expenses: 'المصروفات',
  attendance: 'الحضور',
  employees: 'الموظفون',
  branches: 'الفروع',
}

const ACTION_LABELS = {
  INSERT: 'إضافة',
  UPDATE: 'تعديل',
  DELETE: 'حذف',
} as const

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditRow[]>([])
  const [profiles, setProfiles] = useState<Record<string, Profile>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('audit_logs')
        .select('id, user_id, action, table_name, record_id, occurred_at')
        .order('occurred_at', { ascending: false })
        .limit(200)

      if (!error && data) {
        setLogs(data as AuditRow[])
        const ids = [...new Set(data.map((row) => row.user_id).filter(Boolean))] as string[]
        if (ids.length) {
          const { data: people } = await supabase
            .from('profiles')
            .select('id, full_name, role')
            .in('id', ids)
          const map: Record<string, Profile> = {}
          for (const person of people ?? []) map[person.id] = person as Profile
          setProfiles(map)
        }
      }
      setLoading(false)
    }
    load()
  }, [])

  const roleLabel = (role?: string) =>
    role === 'manager' ? 'المدير' : role === 'accountant' ? 'المحاسب' : 'الاستقبال'

  return (
    <div className="mx-auto flex max-w-7xl flex-col">
      <div className="mb-5">
        <h1 className="text-2xl font-bold">سجل العمليات</h1>
        <p className="mt-1 text-muted-foreground">كل إضافة أو تعديل أو حذف ومن قام بها ووقت تنفيذها</p>
      </div>

      {loading ? (
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">جاري تحميل سجل العمليات...</div>
      ) : logs.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-card p-10 text-center text-muted-foreground">لا توجد عمليات مسجلة حتى الآن</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-start">التاريخ والوقت</th>
                <th className="px-4 py-3 text-start">الحساب</th>
                <th className="px-4 py-3 text-start">العملية</th>
                <th className="px-4 py-3 text-start">القسم</th>
                <th className="px-4 py-3 text-start">رقم السجل</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.map((log) => {
                const person = log.user_id ? profiles[log.user_id] : undefined
                return (
                  <tr key={log.id} className="hover:bg-muted/40">
                    <td className="whitespace-nowrap px-4 py-3">
                      {new Intl.DateTimeFormat('ar-EG-u-nu-latn', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      }).format(new Date(log.occurred_at))}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {person?.full_name ?? 'حساب غير معروف'}
                      {person?.role && <span className="mr-2 text-xs text-muted-foreground">({roleLabel(person.role)})</span>}
                    </td>
                    <td className="px-4 py-3">{ACTION_LABELS[log.action]}</td>
                    <td className="px-4 py-3">{TABLE_LABELS[log.table_name] ?? log.table_name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{log.record_id ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
