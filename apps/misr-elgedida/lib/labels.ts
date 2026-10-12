export type Tone = 'neutral' | 'info' | 'warning' | 'success' | 'danger' | 'primary'

export type LabelMap = Record<string, { label: string; tone: Tone }>

export const WORK_ORDER_STATUS: LabelMap = {
  pending: { label: 'قيد الانتظار', tone: 'warning' },
  in_progress: { label: 'قيد التنفيذ', tone: 'info' },
  completed: { label: 'مكتمل', tone: 'success' },
  ready: { label: 'جاهزة للتسليم', tone: 'primary' },
  delivered: { label: 'تم التسليم', tone: 'primary' },
  cancelled: { label: 'ملغي', tone: 'danger' },
}

export const PRIORITY: LabelMap = {
  low: { label: 'منخفضة', tone: 'neutral' },
  normal: { label: 'عادية', tone: 'info' },
  high: { label: 'عالية', tone: 'warning' },
  urgent: { label: 'عاجلة', tone: 'danger' },
}

export const INVOICE_STATUS: LabelMap = {
  unpaid: { label: 'غير مدفوعة', tone: 'danger' },
  partial: { label: 'مدفوعة جزئياً', tone: 'warning' },
  paid: { label: 'مدفوعة', tone: 'success' },
  cancelled: { label: 'ملغاة', tone: 'neutral' },
}

export const PAYMENT_METHOD: LabelMap = {
  cash: { label: 'نقدي', tone: 'neutral' },
  instapay: { label: 'إنستاباي', tone: 'neutral' },
  wallet: { label: 'محفظة', tone: 'neutral' },
  visa: { label: 'فيزا', tone: 'neutral' },
}

export const EMPLOYEE_STATUS: LabelMap = {
  active: { label: 'على رأس العمل', tone: 'success' },
  on_leave: { label: 'في إجازة', tone: 'warning' },
  inactive: { label: 'غير نشط', tone: 'neutral' },
}

export const ACTIVE_STATUS: LabelMap = {
  true: { label: 'نشط', tone: 'success' },
  false: { label: 'متوقف', tone: 'neutral' },
}

export const LABEL_MAPS = {
  workOrderStatus: WORK_ORDER_STATUS,
  priority: PRIORITY,
  invoiceStatus: INVOICE_STATUS,
  paymentMethod: PAYMENT_METHOD,
  employeeStatus: EMPLOYEE_STATUS,
  active: ACTIVE_STATUS,
} as const

export type LabelMapKey = keyof typeof LABEL_MAPS

export function toOptions(map: LabelMap) {
  return Object.entries(map).map(([value, { label }]) => ({ value, label }))
}

export const EXPENSE_CATEGORIES = [
  'إيجار',
  'رواتب',
  'كهرباء وماء',
  'مشتريات قطع غيار',
  'صيانة ومعدات',
  'تسويق',
  'مصاريف إدارية',
  'أخرى',
]
