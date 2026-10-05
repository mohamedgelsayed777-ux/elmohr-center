import Link from 'next/link'
import { AuthShell } from '@/components/auth/auth-shell'

export default function AuthErrorPage() {
  return (
    <AuthShell title="تعذر إكمال العملية" description="انتهت صلاحية الرابط أو أنه غير صالح.">
      <Link href="/login" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
        العودة لتسجيل الدخول
      </Link>
    </AuthShell>
  )
}
