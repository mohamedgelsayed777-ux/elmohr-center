import { AuthShell } from '@/components/auth/auth-shell'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'

export default function ResetPasswordPage() {
  return (
    <AuthShell title="تعيين كلمة مرور جديدة" description="أدخل كلمة المرور الجديدة لحسابك.">
      <ResetPasswordForm />
    </AuthShell>
  )
}