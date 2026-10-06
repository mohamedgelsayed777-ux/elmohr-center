'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function messageFor(error: { code?: string; status?: number; message: string }) {
  if (error.code === 'email_not_confirmed') return 'لم يتم تأكيد البريد الإلكتروني بعد. يرجى مراجعة بريدك.'
  if (error.status === 429 || error.code === 'over_request_rate_limit') return 'محاولات كثيرة، يرجى الانتظار قليلاً ثم المحاولة.'
  if (error.code === 'invalid_credentials' || error.status === 400) return 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
  return 'حدث خطأ غير متوقع، يرجى المحاولة لاحقاً'
}

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: String(form.get('email') ?? '').trim(),
      password: String(form.get('password') ?? ''),
    })
    if (error) {
      setError(messageFor(error))
      setLoading(false)
      return
    }
    const next = searchParams.get('next')
    router.replace(next && next.startsWith('/') && !next.startsWith('//') ? next : '/')
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">البريد الإلكتروني</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required dir="ltr" className="h-11 text-end" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">كلمة المرور</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required dir="ltr" className="h-11 text-end" />
      </div>
      {error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" disabled={loading} className="h-11 text-base">
        {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        تسجيل الدخول
      </Button>
      <a
        href="/forgot-password"
        className="block cursor-pointer text-center text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        نسيت كلمة المرور؟
      </a>
      <p className="text-center text-sm text-muted-foreground">
        موظف جديد؟{' '}
        <Link href="/sign-up" className="font-medium text-primary underline-offset-4 hover:underline">
          إنشاء حساب
        </Link>
      </p>
    </form>
  )
}
