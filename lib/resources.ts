import {
  EMPLOYEE_STATUS,
  EXPENSE_CATEGORIES,
  INVOICE_STATUS,
  PAYMENT_METHOD,
  PRIORITY,
  WORK_ORDER_STATUS,
  toOptions,
  type LabelMapKey,
} from '@/lib/labels'

export type RelationKey = 'branches' | 'customers' | 'cars' | 'employees' | 'work_orders' | 'vehicle_catalog'

export type Option = { value: string; label: string }

export type FieldType =
  | 'text'
  | 'tel'
  | 'email'
  | 'number'
  | 'textarea'
  | 'select'
  | 'date'
  | 'time'
  | 'boolean'
  | 'relation'

export type Field = {
  name: string
  label: string
  type: FieldType
  required?: boolean
  options?: Option[]
  relation?: RelationKey
  placeholder?: string
  min?: number
  step?: string
  defaultValue?: string | number | boolean
  fullWidth?: boolean
  hint?: string
  readOnly?: boolean
}

export type ColumnFormat =
  | 'text'
  | 'currency'
  | 'number'
  | 'date'
  | 'datetime'
  | 'badge'
  | 'code'

export type Column = {
  key: string
  label: string
  format?: ColumnFormat
  labelMap?: LabelMapKey
  primary?: boolean
  secondary?: boolean
  hideOnMobile?: boolean
  prefix?: string
}

export type Filter = {
  name: string
  label: string
  options?: Option[]
  relation?: RelationKey
}

export type ResourceKey =
  | 'customers'
  | 'cars'
  | 'work_orders'
  | 'branches'
  | 'services'
  | 'parts'
  | 'invoices'
  | 'employees'
  | 'expenses'
  | 'attendance'

export type Resource = {
  key: ResourceKey
  table: string
  path: string
  title: string
  singular: string
  description: string
  select: string
  orderBy: { column: string; ascending: boolean }
  searchColumns: string[]
  searchPlaceholder: string
  filters: Filter[]
  fields: Field[]
  columns: Column[]
}

const branchField: Field = { name: 'branch_id', label: 'الفرع', type: 'relation', relation: 'branches' }
const branchFilter: Filter = { name: 'branch_id', label: 'الفرع', relation: 'branches' }
const branchColumn: Column = { key: 'branch.name', label: 'الفرع', hideOnMobile: true }

export const RESOURCES: Record<ResourceKey, Resource> = {
  customers: {
    key: 'customers',
    table: 'customers',
    path: '/customers',
    title: 'العملاء',
    singular: 'عميل',
    description: 'إدارة بيانات العملاء ومعلومات التواصل',
    select: 'id, full_name, phone, email, city, notes, branch_id, created_at, branch:branches(name)',
    orderBy: { column: 'created_at', ascending: false },
    searchColumns: ['full_name', 'phone', 'email', 'city'],
    searchPlaceholder: 'ابحث بالاسم أو رقم الجوال...',
    filters: [branchFilter],
    fields: [
      { name: 'full_name', label: 'الاسم الكامل', type: 'text', required: true },
      { name: 'phone', label: 'رقم الجوال', type: 'tel', required: true, placeholder: '05xxxxxxxx' },
      { name: 'email', label: 'البريد الإلكتروني', type: 'email' },
      { name: 'city', label: 'المدينة', type: 'text' },
      branchField,
      { name: 'notes', label: 'ملاحظات', type: 'textarea', fullWidth: true },
    ],
    columns: [
      { key: 'full_name', label: 'الاسم', primary: true },
      { key: 'phone', label: 'الجوال', format: 'code', secondary: true },
      { key: 'city', label: 'المدينة', hideOnMobile: true },
      branchColumn,
      { key: 'created_at', label: 'تاريخ التسجيل', format: 'date', hideOnMobile: true },
    ],
  },
  cars: {
    key: 'cars',
    table: 'cars',
    path: '/cars',
    title: 'السيارات',
    singular: 'سيارة',
    description: 'سجل سيارات العملاء وبياناتها الفنية',
    select:
      'id, customer_id, make, model, year, plate_number, vin, color, mileage, created_at, customer:customers(full_name, phone)',
    orderBy: { column: 'created_at', ascending: false },
    searchColumns: ['plate_number', 'make', 'model', 'vin'],
    searchPlaceholder: 'ابحث برقم اللوحة أو الماركة أو رقم الهيكل...',
    filters: [{ name: 'customer_id', label: 'العميل', relation: 'customers' }],
    fields: [
      { name: 'customer_id', label: 'المالك (العميل)', type: 'relation', relation: 'customers', required: true, fullWidth: true },
      { name: 'make', label: 'الشركة المصنعة', type: 'text', required: true, placeholder: 'اختر الشركة المصنعة' },
      { name: 'model', label: 'الطراز', type: 'text', required: true, placeholder: 'اختر الطراز' },
      { name: 'year', label: 'سنة الصنع', type: 'number', min: 1950 },
      { name: 'plate_number', label: 'رقم اللوحة', type: 'text', required: true },
      { name: 'color', label: 'اللون', type: 'text' },
      { name: 'mileage', label: 'عداد الكيلومترات', type: 'number', min: 0 },
      { name: 'vin', label: 'رقم الهيكل (VIN)', type: 'text', fullWidth: true },
    ],
    columns: [
      { key: 'plate_number', label: 'رقم اللوحة', format: 'code', primary: true },
      { key: 'make', label: 'الشركة', secondary: true },
      { key: 'model', label: 'الطراز', secondary: true },
      { key: 'year', label: 'السنة', hideOnMobile: true },
      { key: 'customer.full_name', label: 'المالك' },
      { key: 'mileage', label: 'العداد (كم)', format: 'number', hideOnMobile: true },
    ],
  },
  work_orders: {
    key: 'work_orders',
    table: 'work_orders',
    path: '/work-orders',
    title: 'أوامر العمل',
    singular: 'أمر عمل',
    description: 'متابعة أوامر الإصلاح والصيانة وحالتها',
    select:
      'id, order_number, customer_id, car_id, branch_id, employee_id, status, priority, description, mileage_in, total_amount, opened_at, completed_at, customer:customers(full_name), car:cars(make, model, plate_number), branch:branches(name), employee:employees(full_name)',
    orderBy: { column: 'opened_at', ascending: false },
    searchColumns: ['description'],
    searchPlaceholder: 'ابحث في وصف العمل...',
    filters: [
      { name: 'status', label: 'الحالة', options: toOptions(WORK_ORDER_STATUS) },
      { name: 'priority', label: 'الأولوية', options: toOptions(PRIORITY) },
      branchFilter,
    ],
    fields: [
      { name: 'customer_id', label: 'العميل', type: 'relation', relation: 'customers', required: true },
      { name: 'car_id', label: 'السيارة', type: 'relation', relation: 'cars', required: true, hint: 'يجب أن تكون السيارة مسجلة باسم العميل' },
      branchField,
      { name: 'employee_id', label: 'الفني المسؤول', type: 'relation', relation: 'employees' },
      { name: 'status', label: 'الحالة', type: 'select', options: toOptions(WORK_ORDER_STATUS), required: true, defaultValue: 'pending' },
      { name: 'priority', label: 'الأولوية', type: 'select', options: toOptions(PRIORITY), required: true, defaultValue: 'normal' },
      { name: 'mileage_in', label: 'قراءة العداد عند الاستلام', type: 'number', min: 0 },
      { name: 'total_amount', label: 'إجمالي التكلفة', type: 'number', min: 0, step: '0.01', defaultValue: 0 },
      { name: 'description', label: 'وصف المشكلة / الأعمال المطلوبة', type: 'textarea', fullWidth: true },
    ],
    columns: [
      { key: 'order_number', label: 'رقم الأمر', format: 'code', primary: true, prefix: '#' },
      { key: 'customer.full_name', label: 'العميل', secondary: true },
      { key: 'car.plate_number', label: 'السيارة', format: 'code' },
      { key: 'status', label: 'الحالة', format: 'badge', labelMap: 'workOrderStatus' },
      { key: 'priority', label: 'الأولوية', format: 'badge', labelMap: 'priority', hideOnMobile: true },
      { key: 'employee.full_name', label: 'الفني', hideOnMobile: true },
      { key: 'total_amount', label: 'الإجمالي', format: 'currency' },
      { key: 'opened_at', label: 'تاريخ الفتح', format: 'date', hideOnMobile: true },
    ],
  },
  branches: {
    key: 'branches',
    table: 'branches',
    path: '/branches',
    title: 'الفروع',
    singular: 'فرع',
    description: 'إدارة فروع مركز المهر وبياناتها',
    select: 'id, name, city, address, phone, manager_name, is_active, created_at',
    orderBy: { column: 'created_at', ascending: true },
    searchColumns: ['name', 'city', 'manager_name'],
    searchPlaceholder: 'ابحث باسم الفرع أو المدينة...',
    filters: [],
    fields: [
      { name: 'name', label: 'اسم الفرع', type: 'text', required: true },
      { name: 'city', label: 'المدينة', type: 'text' },
      { name: 'phone', label: 'هاتف الفرع', type: 'tel' },
      { name: 'manager_name', label: 'مدير الفرع', type: 'text' },
      { name: 'address', label: 'العنوان', type: 'textarea', fullWidth: true },
      { name: 'is_active', label: 'الفرع نشط', type: 'boolean', defaultValue: true },
    ],
    columns: [
      { key: 'name', label: 'الفرع', primary: true },
      { key: 'city', label: 'المدينة', secondary: true },
      { key: 'manager_name', label: 'المدير' },
      { key: 'phone', label: 'الهاتف', format: 'code', hideOnMobile: true },
      { key: 'is_active', label: 'الحالة', format: 'badge', labelMap: 'active' },
    ],
  },
  services: {
    key: 'services',
    table: 'services',
    path: '/services',
    title: 'الخدمات',
    singular: 'خدمة',
    description: 'قائمة الخدمات المقدمة وأسعارها',
    select: 'id, name, category, price, duration_minutes, is_active, created_at',
    orderBy: { column: 'name', ascending: true },
    searchColumns: ['name', 'category'],
    searchPlaceholder: 'ابحث باسم الخدمة أو التصنيف...',
    filters: [],
    fields: [
      { name: 'name', label: 'اسم الخدمة', type: 'text', required: true, fullWidth: true },
      { name: 'category', label: 'التصنيف', type: 'text', placeholder: 'ميكانيكا، كهرباء، سمكرة...' },
      { name: 'price', label: 'السعر', type: 'number', min: 0, step: '0.01', required: true, defaultValue: 0 },
      { name: 'duration_minutes', label: 'المدة التقديرية (دقيقة)', type: 'number', min: 0 },
      { name: 'is_active', label: 'الخدمة متاحة', type: 'boolean', defaultValue: true },
    ],
    columns: [
      { key: 'name', label: 'الخدمة', primary: true },
      { key: 'category', label: 'التصنيف', secondary: true },
      { key: 'price', label: 'السعر', format: 'currency' },
      { key: 'duration_minutes', label: 'المدة (دقيقة)', format: 'number', hideOnMobile: true },
      { key: 'is_active', label: 'الحالة', format: 'badge', labelMap: 'active' },
    ],
  },
  parts: {
    key: 'parts',
    table: 'parts',
    path: '/parts',
    title: 'قطع الغيار',
    singular: 'قطعة غيار',
    description: 'مخزون قطع الغيار والكميات والأسعار',
    select: 'id, name, sku, brand, inventory_type, quantity, min_quantity, cost_price, sale_price, branch_id, created_at, branch:branches(name)',
    orderBy: { column: 'name', ascending: true },
    searchColumns: ['name', 'sku', 'brand'],
    searchPlaceholder: 'ابحث باسم القطعة أو الرمز...',
    filters: [
      branchFilter,
      { name: 'inventory_type', label: 'نوع المخزون', options: [
        { value: 'part', label: 'قطع غيار' },
        { value: 'filter', label: 'فلاتر' },
        { value: 'oil', label: 'زيوت' },
      ] },
    ],
    fields: [
      { name: 'inventory_type', label: 'نوع المخزون', type: 'select', required: true, options: [
        { value: 'part', label: 'قطعة غيار' },
        { value: 'filter', label: 'فلتر' },
        { value: 'oil', label: 'زيت' },
      ], defaultValue: 'part' },
      { name: 'name', label: 'اسم القطعة', type: 'text', required: true, fullWidth: true },
      { name: 'sku', label: 'رمز القطعة (SKU)', type: 'text' },
      { name: 'brand', label: 'العلامة التجارية', type: 'text' },
      { name: 'quantity', label: 'الكمية المتوفرة', type: 'number', min: 0, required: true, defaultValue: 0 },
      { name: 'min_quantity', label: 'حد إعادة الطلب', type: 'number', min: 0, required: true, defaultValue: 0 },
      { name: 'cost_price', label: 'سعر التكلفة', type: 'number', min: 0, step: '0.01', required: true, defaultValue: 0 },
      { name: 'sale_price', label: 'سعر البيع', type: 'number', min: 0, step: '0.01', required: true, defaultValue: 0 },
      branchField,
    ],
    columns: [
      { key: 'name', label: 'القطعة', primary: true },
      { key: 'inventory_type', label: 'النوع', format: 'badge' },
      { key: 'sku', label: 'الرمز', format: 'code', secondary: true },
      { key: 'brand', label: 'العلامة', hideOnMobile: true },
      { key: 'quantity', label: 'الكمية', format: 'number' },
      { key: 'sale_price', label: 'سعر البيع', format: 'currency' },
      branchColumn,
    ],
  },
  invoices: {
    key: 'invoices',
    table: 'invoices',
    path: '/invoices',
    title: 'الفواتير',
    singular: 'فاتورة',
    description: 'إصدار الفواتير ومتابعة المدفوعات',
    select:
      'id, invoice_number, work_order_id, customer_id, branch_id, subtotal, discount, tax, total, paid_amount, status, payment_method, issued_at, customer:customers(full_name), branch:branches(name), work_order:work_orders(order_number)',
    orderBy: { column: 'issued_at', ascending: false },
    searchColumns: [],
    searchPlaceholder: '',
    filters: [
      { name: 'status', label: 'حالة الدفع', options: toOptions(INVOICE_STATUS) },
      { name: 'payment_method', label: 'طريقة الدفع', options: toOptions(PAYMENT_METHOD) },
      branchFilter,
      { name: 'customer_id', label: 'العميل', relation: 'customers' },
    ],
    fields: [
      { name: 'customer_id', label: 'العميل', type: 'relation', relation: 'customers', required: true },
      { name: 'work_order_id', label: 'أمر العمل المرتبط', type: 'relation', relation: 'work_orders' },
      branchField,
      { name: 'payment_method', label: 'طريقة الدفع', type: 'select', options: toOptions(PAYMENT_METHOD) },
      { name: 'subtotal', label: 'المبلغ قبل الخصم', type: 'number', min: 0, step: '0.01', required: true, defaultValue: 0 },
      { name: 'discount', label: 'الخصم', type: 'number', min: 0, step: '0.01', defaultValue: 0 },
      { name: 'tax', label: 'الضريبة', type: 'number', min: 0, step: '0.01', defaultValue: 0 },
      { name: 'paid_amount', label: 'المبلغ المدفوع', type: 'number', min: 0, step: '0.01', defaultValue: 0 },
      {
        name: 'status',
        label: 'الحالة',
        type: 'select',
        options: [
          { value: 'auto', label: 'تلقائي حسب المبلغ المدفوع' },
          { value: 'cancelled', label: 'ملغاة' },
        ],
        defaultValue: 'auto',
        hint: 'يتم حساب الإجمالي والحالة تلقائياً',
      },
    ],
    columns: [
      { key: 'invoice_number', label: 'رقم الفاتورة', format: 'code', primary: true, prefix: '#' },
      { key: 'customer.full_name', label: 'العميل', secondary: true },
      { key: 'total', label: 'الإجمالي', format: 'currency' },
      { key: 'paid_amount', label: 'المدفوع', format: 'currency', hideOnMobile: true },
      { key: 'remaining_amount', label: 'المتبقي المطلوب', format: 'currency' },
      { key: 'status', label: 'الحالة', format: 'badge', labelMap: 'invoiceStatus' },
      { key: 'payment_method', label: 'طريقة الدفع', format: 'badge', labelMap: 'paymentMethod', hideOnMobile: true },
      { key: 'issued_at', label: 'التاريخ', format: 'date', hideOnMobile: true },
    ],
  },
  employees: {
    key: 'employees',
    table: 'employees',
    path: '/employees',
    title: 'الموظفون',
    singular: 'موظف',
    description: 'بيانات الموظفين والفنيين ورواتبهم',
    select: 'id, full_name, phone, job_title, branch_id, salary, hire_date, status, created_at, branch:branches(name)',
    orderBy: { column: 'full_name', ascending: true },
    searchColumns: ['full_name', 'phone', 'job_title'],
    searchPlaceholder: 'ابحث بالاسم أو المسمى الوظيفي...',
    filters: [
      { name: 'status', label: 'الحالة', options: toOptions(EMPLOYEE_STATUS) },
      branchFilter,
    ],
    fields: [
      { name: 'full_name', label: 'الاسم الكامل', type: 'text', required: true },
      { name: 'job_title', label: 'المسمى الوظيفي', type: 'text', required: true, placeholder: 'فني ميكانيكا' },
      { name: 'phone', label: 'رقم الجوال', type: 'tel' },
      branchField,
      { name: 'salary', label: 'الراتب الشهري', type: 'number', min: 0, step: '0.01' },
      { name: 'hire_date', label: 'تاريخ التعيين', type: 'date' },
      { name: 'status', label: 'الحالة', type: 'select', options: toOptions(EMPLOYEE_STATUS), required: true, defaultValue: 'active' },
    ],
    columns: [
      { key: 'full_name', label: 'الاسم', primary: true },
      { key: 'job_title', label: 'المسمى', secondary: true },
      { key: 'phone', label: 'الجوال', format: 'code', hideOnMobile: true },
      branchColumn,
      { key: 'salary', label: 'الراتب', format: 'currency', hideOnMobile: true },
      { key: 'status', label: 'الحالة', format: 'badge', labelMap: 'employeeStatus' },
    ],
  },
  expenses: {
    key: 'expenses',
    table: 'expenses',
    path: '/expenses',
    title: 'المصروفات',
    singular: 'مصروف',
    description: 'تسجيل ومتابعة مصروفات الفروع',
    select: 'id, branch_id, category, description, amount, expense_date, payment_method, created_at, branch:branches(name)',
    orderBy: { column: 'expense_date', ascending: false },
    searchColumns: ['description', 'category'],
    searchPlaceholder: 'ابحث في الوصف أو البند...',
    filters: [
      { name: 'category', label: 'البند', options: EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c })) },
      branchFilter,
    ],
    fields: [
      { name: 'category', label: 'البند', type: 'select', required: true, options: EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c })) },
      { name: 'amount', label: 'المبلغ', type: 'number', min: 0, step: '0.01', required: true },
      { name: 'expense_date', label: 'التاريخ', type: 'date', required: true },
      { name: 'payment_method', label: 'طريقة الدفع', type: 'select', options: toOptions(PAYMENT_METHOD) },
      branchField,
      { name: 'description', label: 'الوصف', type: 'textarea', fullWidth: true },
    ],
    columns: [
      { key: 'category', label: 'البند', primary: true },
      { key: 'description', label: 'الوصف', secondary: true, hideOnMobile: true },
      { key: 'amount', label: 'المبلغ', format: 'currency' },
      { key: 'expense_date', label: 'التاريخ', format: 'date' },
      branchColumn,
    ],
  },
  attendance: {
    key: 'attendance',
    table: 'attendance',
    path: '/attendance',
    title: 'سجل الحضور',
    singular: 'سجل حضور',
    description: 'تسجيل حضور وانصراف الموظفين يومياً',
    select: 'id, employee_id, attendance_date, check_in, check_out, status, notes, employee:employees(full_name, job_title)',
    orderBy: { column: 'attendance_date', ascending: false },
    searchColumns: [],
    searchPlaceholder: '',
    filters: [
      { name: 'status', label: 'الحالة', options: [
        { value: 'present', label: 'حاضر' }, { value: 'late', label: 'متأخر' },
        { value: 'absent', label: 'غائب' }, { value: 'leave', label: 'إجازة' },
      ] },
      { name: 'employee_id', label: 'الموظف', relation: 'employees' },
    ],
    fields: [
      { name: 'employee_id', label: 'الموظف', type: 'relation', relation: 'employees', required: true },
      { name: 'attendance_date', label: 'التاريخ', type: 'date', required: true },
      { name: 'check_in', label: 'وقت الحضور', type: 'time' },
      { name: 'check_out', label: 'وقت الانصراف', type: 'time' },
      { name: 'status', label: 'الحالة', type: 'select', required: true, defaultValue: 'present', options: [
        { value: 'present', label: 'حاضر' }, { value: 'late', label: 'متأخر' },
        { value: 'absent', label: 'غائب' }, { value: 'leave', label: 'إجازة' },
      ] },
      { name: 'notes', label: 'ملاحظات', type: 'textarea', fullWidth: true },
    ],
    columns: [
      { key: 'employee.full_name', label: 'الموظف', primary: true },
      { key: 'attendance_date', label: 'التاريخ', format: 'date' },
      { key: 'check_in', label: 'الحضور' },
      { key: 'check_out', label: 'الانصراف' },
      { key: 'status', label: 'الحالة', format: 'badge' },
      { key: 'notes', label: 'ملاحظات', secondary: true, hideOnMobile: true },
    ],
  },

}

export function getResource(key: string): Resource | null {
  return key in RESOURCES ? RESOURCES[key as ResourceKey] : null
}
