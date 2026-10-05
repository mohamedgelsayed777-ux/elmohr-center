'use client'

import { useMemo, useState, useEffect } from 'react'
import { useActionState } from 'react'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/resource/native-select'
import { Textarea } from '@/components/ui/textarea'
import { saveWorkOrderIntake, type ActionState } from '@/lib/actions'

type Option={value:string;label:string}
type Customer={value:string;label:string;phone:string;branch_id:string|null}
type Car={id:string;customer_id:string;make:string;model:string;year:number|null;plate_number:string;vin:string;color:string;mileage:number|null}
type Stock={id:string;name:string;quantity:number;sale_price:number;inventory_type:'part'|'filter'|'oil';branch_id:string|null}
type Props={branches:Option[];employees:Option[];customers:Customer[];cars:Car[];stock:Stock[]}

const initialState:ActionState={ok:false}

export function WorkOrderFormDialog({branches,employees,customers,cars,stock}:Props){
 const [open,setOpen]=useState(false)
 const [state,formAction,pending]=useActionState(saveWorkOrderIntake,initialState)
 const [customerId,setCustomerId]=useState('')
 const [carId,setCarId]=useState('')
 const [branchId,setBranchId]=useState(branches[0]?.value || '')
 const [items,setItems]=useState<{part_id:string;quantity:number}[]>([])
 const selectedCustomer=customers.find(c=>c.value===customerId)
 const customerCars=useMemo(()=>cars.filter(c=>c.customer_id===customerId),[cars,customerId])
 const selectedCar=customerCars.find(c=>c.id===carId)
 const branchStock=useMemo(()=>stock.filter(s=>!s.branch_id || s.branch_id===branchId),[stock,branchId])
 const parts=branchStock.filter(s=>s.inventory_type==='part')
 const filters=branchStock.filter(s=>s.inventory_type==='filter')
 const oils=branchStock.filter(s=>s.inventory_type==='oil')
 const partsTotal=useMemo(()=>items.reduce((sum,item)=>sum+(Number(branchStock.find(s=>s.id===item.part_id)?.sale_price??0)*item.quantity),0),[items,branchStock])
 const [laborAmount,setLaborAmount]=useState(0)
 const [amountPaid,setAmountPaid]=useState(0)
 const totalAmount=useMemo(()=>Math.round((partsTotal+laborAmount)*100)/100,[partsTotal,laborAmount])
 const remainingAmount=Math.max(0,Math.round((totalAmount-amountPaid)*100)/100)
 const addItem=(id:string)=>{if(!id)return;setItems(x=>x.some(i=>i.part_id===id)?x:x.concat({part_id:id,quantity:1}))}
 const updateQty=(id:string,q:number)=>setItems(x=>q<=0?x.filter(i=>i.part_id!==id):x.map(i=>i.part_id===id?{...i,quantity:q}:i))
 const removeItem=(id:string)=>setItems(x=>x.filter(i=>i.part_id!==id))
 useEffect(()=>{if(state.ok){setOpen(false);setItems([]);setCustomerId('');setCarId('');setLaborAmount(0);setAmountPaid(0);toast.success('تم إنشاء أمر العمل وربطه بالعميل والسيارة بنجاح')}},[state.ok])
 return <>
  <Button onClick={()=>setOpen(true)} className="h-10"><Plus className="size-4"/>إضافة أمر عمل</Button>
  <Dialog open={open} onOpenChange={setOpen}>
   <DialogContent className="max-h-[94dvh] overflow-y-auto sm:max-w-3xl">
    <DialogHeader className="text-start"><DialogTitle>إضافة أمر عمل جديد</DialogTitle><DialogDescription>اختر العميل أولاً، وستظهر سياراته المسجلة تلقائياً.</DialogDescription></DialogHeader>
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="items_json" value={JSON.stringify(items)}/>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
       <div>
        <Label htmlFor="customer_id">اسم العميل *</Label>
        <NativeSelect id="customer_id" name="customer_id" required value={customerId} onChange={e=>{const id=e.target.value;const c=customers.find(x=>x.value===id);setCustomerId(id);setCarId('');setBranchId(c?.branch_id || branches[0]?.value || '');setItems([])}}>
          <option value="">اختر العميل</option>
          {customers.map(o=><option key={o.value} value={o.value}>{o.label}{o.phone ? ` — ${o.phone}` : ''}</option>)}
        </NativeSelect>
        {customers.length===0&&<p className="mt-1 text-xs text-muted-foreground">لا يوجد عملاء مسجلون بعد</p>}
       </div>
       <div>
        <Label htmlFor="branch_id">الفرع *</Label>
        <NativeSelect id="branch_id" name="branch_id" required value={branchId} onChange={e=>{setBranchId(e.target.value);setItems([])}}>
          <option value="">اختر الفرع</option>
          {branches.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
        </NativeSelect>
       </div>
       <div className="sm:col-span-2">
        <Label htmlFor="car_id">السيارة *</Label>
        <NativeSelect id="car_id" name="car_id" required value={carId} onChange={e=>setCarId(e.target.value)} disabled={!customerId}>
          <option value="">{customerId ? (customerCars.length ? 'اختر سيارة العميل' : 'لا توجد سيارات مسجلة لهذا العميل') : 'اختر العميل أولاً'}</option>
          {customerCars.map(c=><option key={c.id} value={c.id}>{c.make} {c.model}{c.year ? ` — ${c.year}` : ''}{c.plate_number ? ` — لوحة ${c.plate_number}` : ''}</option>)}
        </NativeSelect>
       </div>
       {selectedCar ? (
        <div className="sm:col-span-2 rounded-lg border bg-muted/40 p-4">
         <div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">بيانات السيارة</h3><span className="text-xs text-muted-foreground">بيانات مسجلة من ملف السيارات</span></div>
         <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Info label="الشركة المصنعة" value={selectedCar.make}/>
          <Info label="الطراز" value={selectedCar.model}/>
          <Info label="سنة الصنع" value={selectedCar.year}/>
          <Info label="رقم اللوحة" value={selectedCar.plate_number}/>
          <Info label="رقم الهيكل VIN" value={selectedCar.vin}/>
          <Info label="اللون" value={selectedCar.color}/>
          <Info label="عداد الكيلومترات" value={selectedCar.mileage !== null ? `${selectedCar.mileage} كم` : ''}/>
         </div>
        </div>
       ) : null}
       <div><Label>الفني المسؤول</Label><NativeSelect name="employee_id"><option value="">بدون</option>{employees.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</NativeSelect></div>
       <div><Label>الحالة *</Label><NativeSelect name="status" defaultValue="pending"><option value="pending">قيد الانتظار</option><option value="in_progress">قيد التنفيذ</option><option value="completed">مكتمل</option><option value="ready">جاهزة للتسليم</option><option value="delivered">تم التسليم</option><option value="cancelled">ملغي</option></NativeSelect></div>
       <div><Label>الأولوية</Label><NativeSelect name="priority" defaultValue="normal"><option value="low">منخفضة</option><option value="normal">عادية</option><option value="high">عالية</option><option value="urgent">عاجلة</option></NativeSelect></div>
      </div>
      <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">يتم عرض مخزون الفرع المختار فقط، والأسعار تُسحب تلقائياً من سعر البيع في المخزن.</p>
      <div><Label>الأعطال</Label><Textarea name="faults" rows={3} className="mt-1.5" placeholder="اكتب الأعطال والملاحظات كما وصفها العميل أو تم اكتشافها"/></div>
      <StockSection title="قطع الغيار" items={items} stock={parts} onAdd={addItem} onQty={updateQty} onRemove={removeItem}/>
      <StockSection title="الفلاتر" items={items} stock={filters} onAdd={addItem} onQty={updateQty} onRemove={removeItem}/>
      <StockSection title="الزيوت" items={items} stock={oils} onAdd={addItem} onQty={updateQty} onRemove={removeItem}/>
      <div><Label>الإصلاحات التي تم تنفيذها</Label><Textarea name="repairs_done" rows={3} className="mt-1.5" placeholder="اكتب الإصلاحات والأعمال التي تم تنفيذها"/></div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
       <div><Label>المصنعيات</Label><Input name="labor_amount" type="number" min="0" step="0.01" value={laborAmount} onChange={e=>setLaborAmount(Math.max(0,Number(e.target.value)||0))} className="mt-1.5"/></div>
       <div><Label>المدفوع</Label><Input name="amount_paid" type="number" min="0" step="0.01" value={amountPaid} onChange={e=>setAmountPaid(Math.max(0,Number(e.target.value)||0))} className="mt-1.5"/></div>
       <div><Label>طريقة الدفع</Label><NativeSelect name="payment_method"><option value="">اختر</option><option value="cash">نقدي</option><option value="instapay">إنستاباي</option><option value="wallet">محفظة</option><option value="visa">فيزا</option></NativeSelect></div>
      </div>
      <div className="rounded-xl border-2 bg-muted/30 p-4">
       <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div><p className="text-sm text-muted-foreground">إجمالي قطع الغيار والأصناف</p><p className="mt-1 text-xl font-bold">{partsTotal.toFixed(2)} ج.م</p></div>
        <div><p className="text-sm text-muted-foreground">المصنعيات</p><p className="mt-1 text-xl font-bold">{laborAmount.toFixed(2)} ج.م</p></div>
        <div className="rounded-lg border p-3"><p className="text-sm text-muted-foreground">الإجمالي المستحق</p><p className="mt-1 text-2xl font-bold">{totalAmount.toFixed(2)} ج.م</p><p className="mt-1 text-sm text-muted-foreground">المتبقي: {remainingAmount.toFixed(2)} ج.م</p></div>
       </div>
      </div>
      {state.error&&<p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{state.error}</p>}
      <DialogFooter><Button type="submit" disabled={pending||!customerId||!carId}>{pending&&<Loader2 className="size-4 animate-spin"/>}حفظ أمر العمل</Button><Button type="button" variant="outline" onClick={()=>setOpen(false)}>إلغاء</Button></DialogFooter>
    </form>
   </DialogContent>
  </Dialog>
 </>
}

function Info({label,value}:{label:string;value:unknown}){
 const text=value===null||value===undefined||String(value).trim()===''?'غير مسجل':String(value)
 return <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-0.5 text-sm font-medium">{text}</p></div>
}

function StockSection({title,items,stock,onAdd,onQty,onRemove}:{title:string;items:{part_id:string;quantity:number}[];stock:Stock[];onAdd:(id:string)=>void;onQty:(id:string,q:number)=>void;onRemove:(id:string)=>void}){
 const selected=items.map(i=>stock.find(s=>s.id===i.part_id)).filter(Boolean) as Stock[]
 return <section className="rounded-lg border p-4"><div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">{title}</h3><NativeSelect onChange={e=>{onAdd(e.target.value);e.currentTarget.value=''}} defaultValue=""><option value="">إضافة {title === 'الزيوت'?'زيت':'صنف'}...</option>{stock.map(s=><option key={s.id} value={s.id}>{s.name} — المتاح {s.quantity}</option>)}</NativeSelect></div>{selected.length===0?<p className="text-sm text-muted-foreground">لم تتم إضافة أي {title === 'الزيوت'?'زيوت':'أصناف'}.</p>:<div className="space-y-2">{selected.map(s=>{const q=items.find(i=>i.part_id===s.id)?.quantity||1;return <div key={s.id} className="flex items-center gap-2"><span className="min-w-0 flex-1 text-sm">{s.name} <span className="text-muted-foreground">(متاح {s.quantity})</span></span><Input type="number" min="1" max={s.quantity} value={q} onChange={e=>onQty(s.id,Number(e.target.value))} className="w-24"/><Button type="button" variant="ghost" size="icon-sm" onClick={e=>{e.preventDefault();e.stopPropagation();onRemove(s.id)}}><Trash2 className="size-4"/></Button></div>})}</div>}</section>
}
