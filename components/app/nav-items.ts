import {
  BarChart3,
  Building2,
  Car,
  ClipboardList,
  LayoutDashboard,
  Package,
  Receipt,
  Users,
  UserCog,
  Wallet,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = { href: string; label: string; icon: LucideIcon }
export type NavGroup = { title: string; items: NavItem[] }

export const NAV_GROUPS: NavGroup[] = [
  {
    title: 'الرئيسية',
    items: [{ href: '/', label: 'لوحة التحكم', icon: LayoutDashboard }],
  },
  {
    title: 'التشغيل',
    items: [
      { href: '/work-orders', label: 'أوامر العمل', icon: ClipboardList },
      { href: '/customers', label: 'العملاء', icon: Users },
      { href: '/cars', label: 'السيارات', icon: Car },
    ],
  },
  {
    title: 'الخدمات والمخزون',
    items: [
      { href: '/services', label: 'الخدمات', icon: Wrench },
      { href: '/parts', label: 'قطع الغيار', icon: Package },
    ],
  },
  {
    title: 'المالية',
    items: [
      { href: '/invoices', label: 'الفواتير', icon: Receipt },
      { href: '/expenses', label: 'المصروفات', icon: Wallet },
      { href: '/reports', label: 'التقارير', icon: BarChart3 },
    ],
  },
  {
    title: 'الإدارة',
    items: [
      { href: '/branches', label: 'الفروع', icon: Building2 },
      { href: '/employees', label: 'الموظفون', icon: UserCog },
    ],
  },
]

export const BOTTOM_NAV: NavItem[] = [
  { href: '/', label: 'الرئيسية', icon: LayoutDashboard },
  { href: '/work-orders', label: 'الأوامر', icon: ClipboardList },
  { href: '/customers', label: 'العملاء', icon: Users },
  { href: '/invoices', label: 'الفواتير', icon: Receipt },
]

export function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)
}
