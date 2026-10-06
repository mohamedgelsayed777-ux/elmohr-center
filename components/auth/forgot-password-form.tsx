'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const email = String(new FormData(e.currentTarget).get('email') ?? '').trim()
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })
    if (error) setError(error.message || 'تعذر إرسال رابط الاسترجاع')
    else setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="rounded-md bg-primary/10 px-3 py-3 text-sm">
          تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني. راجع البريد الوارد والرسائل غير المرغوب فيها.
        </p>
        <Link href="/login" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
          العودة لتسجيل الدخول
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">البريد الإلكتروني</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required dir="ltr" className="h-11 text-end" />
      </div>
      {error && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading} className="h-11 text-base">
        {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        إرسال رابط الاسترجاع
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">العودة لتسجيل الدخول</Link>
      </p>
    </form>
  )
}