'use client'

import { useState } from 'react'
import { KeyRound, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type Account = { id: string; full_name: string; role: string; employee_code: string | null }

const roleLabels: Record<string, string> = {
  manager: 'مدير',
  reception: 'استقبال',
  accountant: 'محاسب',
}

export function EmployeePasswordDialog({ account }: { account: Account }) {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pending, setPending] = useState(false)

  async function submit() {
    if (password.length < 6) {
      toast.error('كلمة المرور يجب ألا تقل عن 6 أحرف')
      return
    }
    if (password !== confirmPassword) {
      toast.error('كلمتا المرور غير متطابقتين')
      return
    }

    setPending(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.functions.invoke('manager-change-employee-password', {
        body: { targetUserId: account.id, password },
      })
      if (error) throw error
      if (!data?.success) throw new Error(data?.error || 'تعذر تغيير كلمة المرور')
      toast.success(`تم تغيير كلمة مرور حساب ${account.full_name} بنجاح`)
      setOpen(false)
      setPassword('')
      setConfirmPassword('')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'تعذر تغيير كلمة المرور'
      toast.error(message)
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <KeyRound className="size-4" />
        تغيير كلمة المرور
      </Button>
      <Dialog open={open} onOpenChange={(value) => {
        if (!pending) setOpen(value)
        if (!value && !pending) {
          setPassword('')
          setConfirmPassword('')
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-start">
            <DialogTitle>تغيير كلمة مرور الحساب</DialogTitle>
            <DialogDescription>
              الحساب: {account.full_name} — {roleLabels[account.role] ?? account.role}
              {account.employee_code ? ` — ${account.employee_code}` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5 text-sm">
              كلمة المرور الجديدة
              <Input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              تأكيد كلمة المرور
              <Input type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={6} />
            </label>
            <p className="text-xs text-muted-foreground">لن تتغير صلاحيات الحساب أو بيانات الموظف.</p>
          </div>
          <DialogFooter className="gap-2 sm:justify-start">
            <Button onClick={submit} disabled={pending || !password || !confirmPassword}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              حفظ كلمة المرور
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
