import { Brand } from '@/components/app/brand'

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <main className="flex min-h-dvh flex-col bg-sidebar lg:flex-row">
      <section className="flex flex-col justify-between gap-6 px-6 pb-8 pt-10 text-sidebar-foreground lg:w-[42%] lg:p-12">
        <Brand inverted />
        <div className="hidden flex-col gap-4 lg:flex">
          <h2 className="text-balance text-3xl font-bold leading-snug text-sidebar-accent-foreground">
            إدارة متكاملة لأوامر العمل والعملاء والفواتير في مكان واحد
          </h2>
          <p className="text-pretty leading-relaxed text-sidebar-foreground/75">
            نظام داخلي مخصص لفريق عمل مركز المهر لمتابعة الصيانة والفروع والمخزون والتقارير المالية.
          </p>
        </div>
        <p className="hidden text-sm text-sidebar-foreground/60 lg:block">للاستخدام الداخلي فقط</p>
      </section>
      <section className="flex flex-1 items-start justify-center rounded-t-3xl bg-background px-5 py-10 lg:items-center lg:rounded-none">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          {children}
        </div>
      </section>
    </main>
  )
}
