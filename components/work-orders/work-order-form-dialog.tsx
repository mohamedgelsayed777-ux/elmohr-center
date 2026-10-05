'use client'

import { useMemo, useState } from 'react'
import { useActionState, useEffect } from 'react'
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
type Stock={id:string;name:string;quantity:number;sale_price:number;inventory_type:'part'|'oil'}
type Props={branches:Option[]; employees:Option[]; vehicles:{make:string;model:string}[]; stock:Stock[]}

const initialState:ActionState={ok:false}

export function WorkOrderFormDialog({branches,employees,vehicles,stock}:Props){
 const [open,setOpen]=useState(false)
 const [state,formAction,pending]=useActionState(saveWorkOrderIntake,initialState)
 const [make,setMake]=useState('')
 const [items,setItems]=useState<{part_id:string;quantity:number}[]>([])
 const makes=useMemo(()=>Array.from(new Set(vehicles.map(v=>v.make))).sort((a,b)=>a.localeCompare(b,'ar')),[vehicles])
 const models=useMemo(()=>vehicles.filter(v=>v.make===make).map(v=>v.model),[vehicles,make])
 const parts=stock.filter(s=>s.inventory_type==='part')
 const oils=stock.filter(s=>s.inventory_type==='oil')
 const addItem=(id:string)=>{if(!id)return;setItems(x=>x.some(i=>i.part_id===id)?x:x.concat({part_id:id,quantity:1}))}
 const updateQty=(id:string,q:number)=>setItems(x=>x.map(i=>i.part_id===id?{...i,quantity:q}:i))
 useEffect(()=>{if(state.ok){setOpen(false);setItems([]);setMake('');toast.success('تم إنشاء أمر العمل وخصم المخزون تلقائياً')}} ,[state.ok])
 return <>
  <Button onClick={()=>setOpen(true)} className="h-10"><Plus className="size-4"/>إضافة أمر عمل</Button>
  <Dialog open={open} onOpenChange={setOpen}>
   <DialogContent className="max-h-[94dvh] overflow-y-auto sm:max-w-3xl">
    <DialogHeader className="text-start"><DialogTitle>إضافة أمر عمل جديد</DialogTitle><DialogDescription>أدخل بيانات السيارة والأعطال والقطع والزيوت المستخدمة.</DialogDescription></DialogHeader>
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="items_json" value={JSON.stringify(items)}/>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
       <div><Label>اسم العميل *</Label><Input name="customer_name" required className="mt-1.5" placeholder="اكتب اسم العميل"/></div>
       <div><Label>الفرع *</Label><NativeSelect name="branch_id" required defaultValue={branches[0]?.value||''}><option value="">اختر الفرع</option>{branches.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</NativeSelect></div>
       <div><Label>الشركة *</Label><NativeSelect name="make" required value={make} onChange={e=>setMake(e.target.value)}><option value="">اختر الشركة</option>{makes.map(x=><option key={x}>{x}</option>)}</NativeSelect></div>
       <div><Label>الموديل *</Label><NativeSelect name="model" required defaultValue=""><option value="">اختر الموديل</option>{models.map(x=><option key={x}>{x}</option>)}</NativeSelect></div>
       <div><Label>رقم الشاسيه (VIN)</Label><Input name="vin" className="mt-1.5" dir="ltr" placeholder="اكتب رقم الشاسيه"/></div>
       <div><Label>الفني المسؤول</Label><NativeSelect name="employee_id"><option value="">بدون</option>{employees.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</NativeSelect></div>
       <div><Label>الحالة *</Label><NativeSelect name="status" defaultValue="pending"><option value="pending">قيد الانتظار</option><option value="in_progress">قيد التنفيذ</option><option value="completed">مكتمل</option><option value="ready">جاهزة للتسليم</option><option value="delivered">تم التسليم</option><option value="cancelled">ملغي</option></NativeSelect></div>
       <div><Label>الأولوية</Label><NativeSelect name="priority" defaultValue="normal"><option value="low">منخفضة</option><option value="normal">عادية</option><option value="high">عالية</option><option value="urgent">عاجلة</option></NativeSelect></div>
      </div>
      <div><Label>الأعطال</Label><Textarea name="faults" rows={3} className="mt-1.5" placeholder="اكتب الأعطال والملاحظات كما وصفها العميل أو تم اكتشافها"/></div>
      <StockSection title="قطع الغيار" items={items} stock={parts} onAdd={addItem} onQty={updateQty}/>
      <StockSection title="الزيوت" items={items} stock={oils} onAdd={addItem} onQty={updateQty}/>
      <div><Label>الإصلاحات التي تم تنفيذها</Label><Textarea name="repairs_done" rows={3} className="mt-1.5" placeholder="اكتب الإصلاحات والأعمال التي تم تنفيذها"/></div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
       <div><Label>إجمالي المبلغ *</Label><Input name="total_amount" type="number" min="0" step="0.01" defaultValue="0" required className="mt-1.5"/></div>
       <div><Label>طريقة الدفع</Label><NativeSelect name="payment_method"><option value="">اختر</option><option value="cash">نقدي</option><option value="instapay">إنستاباي</option><option value="wallet">محفظة</option><option value="visa">فيزا</option></NativeSelect></div>
      </div>
      {state.error&&<p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{state.error}</p>}
      <DialogFooter><Button type="submit" disabled={pending}>{pending&&<Loader2 className="size-4 animate-spin"/>}حفظ أمر العمل</Button><Button type="button" variant="outline" onClick={()=>setOpen(false)}>إلغاء</Button></DialogFooter>
    </form>
   </DialogContent>
  </Dialog>
 </>
}

function StockSection({title,items,stock,onAdd,onQty}:{title:string;items:{part_id:string;quantity:number}[];stock:Stock[];onAdd:(id:string)=>void;onQty:(id:string,q:number)=>void}){
 const selected=items.map(i=>stock.find(s=>s.id===i.part_id)).filter(Boolean) as Stock[]
 return <section className="rounded-lg border p-4"><div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">{title}</h3><NativeSelect onChange={e=>{onAdd(e.target.value);e.currentTarget.value=''}} defaultValue=""><option value="">إضافة {title === 'الزيوت'?'زيت':'قطعة'}...</option>{stock.map(s=><option key={s.id} value={s.id}>{s.name} — المتاح {s.quantity}</option>)}</NativeSelect></div>{selected.length===0?<p className="text-sm text-muted-foreground">لم تتم إضافة أي {title === 'الزيوت'?'زيوت':'قطع غيار'}.</p>:<div className="space-y-2">{selected.map(s=>{const q=items.find(i=>i.part_id===s.id)?.quantity||1;return <div key={s.id} className="flex items-center gap-2"><span className="min-w-0 flex-1 text-sm">{s.name} <span className="text-muted-foreground">(متاح {s.quantity})</span></span><Input type="number" min="1" max={s.quantity} value={q} onChange={e=>onQty(s.id,Number(e.target.value))} className="w-24" /><Button type="button" variant="ghost" size="icon-sm" onClick={()=>onQty(s.id,0)}><Trash2 className="size-4"/></Button></div>})}</div>}</section>
}
