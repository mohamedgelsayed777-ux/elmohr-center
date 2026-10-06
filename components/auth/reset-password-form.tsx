'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ResetPasswordForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const form = new FormData(e.currentTarget)
    const password = String(form.get('password') ?? '')
    const confirm = String(form.get('confirm') ?? '')
    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      setLoading(false)
      return
    }
    if (password !== confirm) {
      setError('كلمتا المرور غير متطابقتين')
      setLoading(false)
      return
    }
    const { error } = await createClient().auth.updateUser({ password })
    if (error) setError('تعذر تغيير كلمة المرور، قد يكون الرابط منتهي الصلاحية.')
    else router.replace('/login?reset=success')
    setLoading(false)
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">كلمة المرور الجديدة</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={6} dir="ltr" className="h-11 text-end" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirm">تأكيد كلمة المرور</Label>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required minLength={6} dir="ltr" className="h-11 text-end" />
      </div>
      {error && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading} className="h-11 text-base">
        {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        حفظ كلمة المرور الجديدة
      </Button>
    </form>
  )
}