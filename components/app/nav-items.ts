import {
  BarChart3,
  Building2,
  Car,
  ClipboardList,
  LayoutDashboard,
  Package,
  Filter,
  Droplets,
  ClipboardCheck,
  Receipt,
  Users,
  UserCog,
  Wallet,
  History,
  Trash2,
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
      { href: '/parts?inventory_type=part', label: 'مخزن قطع الغيار', icon: Package },
      { href: '/parts?inventory_type=filter', label: 'مخزن الفلاتر', icon: Filter },
      { href: '/parts?inventory_type=oil', label: 'مخزن الزيوت', icon: Droplets },
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
      { href: '/attendance', label: 'سجل الحضور', icon: ClipboardCheck },
      { href: '/audit-logs', label: 'سجل العمليات', icon: History },
      { href: '/deleted-records', label: 'سجل المحذوفات', icon: Trash2 },
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
