'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function messageFor(error: { code?: string; status?: number }) {
  if (error.code === 'weak_password') return 'كلمة المرور ضعيفة، استخدم 8 أحرف على الأقل مع أرقام ورموز'
  if (error.status === 429 || error.code?.startsWith('over_')) return 'محاولات كثيرة، يرجى المحاولة لاحقاً'
  if (error.code === 'email_address_invalid') return 'البريد الإلكتروني غير صالح'
  return 'تعذر إنشاء الحساب، يرجى المحاولة لاحقاً'
}

export function SignUpForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const password = String(form.get('password') ?? '')
    if (password.length < 8) return setError('كلمة المرور يجب ألا تقل عن 8 أحرف')
    if (password !== form.get('confirm')) return setError('كلمتا المرور غير متطابقتين')

    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: String(form.get('email') ?? '').trim(),
      password,
      options: {
        emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback`,
        data: { full_name: String(form.get('full_name') ?? '').trim() },
      },
    })
    setLoading(false)
    if (error) return setError(messageFor(error))
    setDone(true)
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border bg-card p-6 text-center">
        <CheckCircle2 className="size-10 text-success" aria-hidden="true" />
        <p className="font-semibold">تم إنشاء الحساب</p>
        <p className="text-sm text-muted-foreground">أرسلنا رابط التأكيد إلى بريدك الإلكتروني. أكّد بريدك ثم سجّل الدخول.</p>
        <Link href="/login" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
          العودة لتسجيل الدخول
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="full_name">الاسم الكامل</Label>
        <Input id="full_name" name="full_name" required autoComplete="name" className="h-11" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">البريد الإلكتروني</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required dir="ltr" className="h-11 text-end" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">كلمة المرور</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} dir="ltr" className="h-11 text-end" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirm">تأكيد كلمة المرور</Label>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required dir="ltr" className="h-11 text-end" />
      </div>
      {error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" disabled={loading} className="h-11 text-base">
        {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        إنشاء الحساب
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        لديك حساب؟{' '}
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          تسجيل الدخول
        </Link>
      </p>
    </form>
  )
}
