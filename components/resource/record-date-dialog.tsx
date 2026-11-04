'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarClock, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateRecordDate } from '@/lib/actions'

type Props = {
  resourceKey: 'work_orders' | 'invoices'
  recordId: string
  currentDate: string
  label: string
}

function cairoDate(value: string) {
  if (!value) return ''
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date(value))
  const get = (key: string) => parts.find((part) => part.type === key)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}`
}

export function RecordDateDialog({ resourceKey, recordId, currentDate, label }: Props) {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState(cairoDate(currentDate))
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function save() {
    startTransition(async () => {
      const result = await updateRecordDate(resourceKey, recordId, date)
      if (!result.ok) {
        toast.error(result.error ?? 'تعذر تعديل التاريخ')
        return
      }
      toast.success('تم تعديل التاريخ بنجاح')
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      <Button type="button" variant="ghost" size="icon-sm" aria-label={`تعديل ${label}`} title={`تعديل ${label}`} onClick={() => { setDate(cairoDate(currentDate)); setOpen(true) }}>
        <CalendarClock className="size-4" />
      </Button>
      {open && <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !pending) setOpen(false) }}>
        <div role="dialog" aria-modal="true" aria-labelledby={`record-date-title-${recordId}`} className="w-full max-w-md rounded-xl bg-popover p-5 text-popover-foreground shadow-xl">
          <h2 id={`record-date-title-${recordId}`} className="text-lg font-semibold">تعديل {label}</h2>
          <p className="mt-1 text-sm text-muted-foreground">تغيير التاريخ فقط؛ لن يتم تعديل المبالغ أو الأصناف أو رقم السجل.</p>
          <div className="mt-4 grid gap-2">
            <Label htmlFor={`record-date-${recordId}`}>التاريخ الجديد</Label>
            <Input id={`record-date-${recordId}`} type="date" value={date} onChange={(event) => setDate(event.target.value)} disabled={pending} />
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>إلغاء</Button>
            <Button type="button" onClick={save} disabled={pending || !date || date === cairoDate(currentDate)}>
              {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              حفظ التاريخ
            </Button>
          </div>
        </div>
      </div>}
    </>
  )
}
