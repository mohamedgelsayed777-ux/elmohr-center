'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ResourceToolbar } from '@/components/resource/resource-toolbar'
import { Trash2 } from 'lucide-react'

type DeletedRow={id:string;log_number:number;user_id:string|null;action:'DELETE';table_name:string;record_id:string|null;old_data:Record<string,unknown>|null;occurred_at:string}
type Profile={id:string;full_name:string|null;role:string|null;employee_code:string|null}

const TABLE_LABELS:Record<string,string>={customers:'العملاء',cars:'السيارات',work_orders:'أوامر العمل',invoices:'الفواتير',invoice_items:'بنود الفواتير',parts:'المخزون',services:'الخدمات',expenses:'المصروفات',attendance:'الحضور',employees:'الموظفون',branches:'الفروع'}
const FIELD_LABELS:Record<string,string>={order_number:'رقم أمر العمل',invoice_number:'رقم الفاتورة',name:'الاسم',description:'البيان',price:'السعر',sale_price:'سعر البيع',quantity:'الكمية',status:'الحالة',total_amount:'الإجمالي',subtotal:'الإجمالي قبل الخصم',discount:'الخصم',tax:'الضريبة',paid_amount:'المدفوع',payment_method:'طريقة الدفع',labor_amount:'المصنعيات',customer_id:'العميل',car_id:'السيارة',branch_id:'الفرع',employee_id:'الموظف',part_id:'الصنف',item_type:'نوع البند',unit_price:'سعر الوحدة',category:'التصنيف',brand:'العلامة التجارية',part_number:'رقم الصنف',inventory_type:'نوع المخزون',min_quantity:'الحد الأدنى',cost_price:'سعر التكلفة',mileage_in:'الكيلومترات',priority:'الأولوية',opened_at:'تاريخ الفتح',created_at:'تاريخ الإنشاء',issued_at:'تاريخ الإصدار'}
const OMIT_FIELDS=new Set(['id'])
const STATUS_LABELS:Record<string,string>={pending:'قيد الانتظار',in_progress:'جاري التنفيذ',completed:'تم الإصلاح',delivered:'تم التسليم',cancelled:'ملغى'}
const PRIORITY_LABELS:Record<string,string>={low:'منخفضة',normal:'عادية',high:'عالية',urgent:'عاجلة'}
const PAYMENT_LABELS:Record<string,string>={cash:'نقدي',card:'بطاقة',transfer:'تحويل',credit:'آجل'}
const formatDateTime=(v:unknown)=>{if(typeof v!=='string'||!v)return String(v??'—');const d=new Date(v);return Number.isNaN(d.getTime())?v:new Intl.DateTimeFormat('ar-EG',{dateStyle:'medium',timeStyle:'short'}).format(d)}

const formatValue=(key:string,value:unknown,lookups:Record<string,string>)=>{
 if(value===null||value===undefined||value==='') return '—'
 if(typeof value==='boolean') return value?'نعم':'لا'
 if(typeof value==='object') return JSON.stringify(value)
 if(['customer_id','car_id','branch_id','employee_id','part_id'].includes(key)) return lookups[String(value)]??'بيانات مرتبطة'
 return String(value)
}
const titleFor=(row:DeletedRow)=>{
 const d=row.old_data??{}
 if(row.table_name==='work_orders') return `أمر عمل #${d.order_number??row.record_id}`
 if(row.table_name==='invoices') return `فاتورة #${d.invoice_number??row.record_id}`
 if(row.table_name==='services') return `خدمة: ${d.name??row.record_id}`
 if(row.table_name==='parts') return `صنف: ${d.name??row.record_id}`
 if(row.table_name==='customers') return `عميل: ${d.name??row.record_id}`
 if(row.table_name==='cars') return `سيارة: ${d.plate_number??d.name??row.record_id}`
 if(row.table_name==='expenses') return `مصروف #${d.expense_number??row.record_id}`
 if(row.table_name==='attendance') return `حضور #${d.attendance_number??row.record_id}`
 return `سجل #${row.record_id??'—'}`
}

export default function DeletedRecordsPage(){
 const searchParams=useSearchParams()
 const [rows,setRows]=useState<DeletedRow[]>([])
 const [archivedRows,setArchivedRows]=useState<DeletedRow[]>([])
 const [profiles,setProfiles]=useState<Record<string,Profile>>({})
 const [lookups,setLookups]=useState<Record<string,string>>({})
 const [loading,setLoading]=useState(true);const[error,setError]=useState('')
 const year=searchParams.get('year')??'';const month=searchParams.get('month')??'';const day=searchParams.get('day')??''
 const tab=searchParams.get('tab')??'current'
 useEffect(()=>{(async()=>{
  setLoading(true);setError('')
  try{
  const supabase=createClient()
  const[{data,error},{data:archived,error:archiveError}]=await Promise.all([supabase.from('audit_logs').select('id,log_number,user_id,action,table_name,record_id,old_data,occurred_at').eq('action','DELETE').order('occurred_at',{ascending:false}).limit(500),supabase.rpc('get_archived_deleted_logs')])
  if(error||archiveError){setError((error??archiveError)?.message??'تعذر تحميل سجل المحذوفات');setLoading(false);return}
  let filtered=(data??[]) as DeletedRow[]
  if(year) filtered=filtered.filter(x=>new Date(x.occurred_at).getFullYear()===Number(year))
  if(month) filtered=filtered.filter(x=>new Date(x.occurred_at).getMonth()+1===Number(month))
  if(day) filtered=filtered.filter(x=>new Date(x.occurred_at).getDate()===Number(day))
  const archivedFiltered=((archived??[]) as DeletedRow[]).filter(x=>{const d=new Date(x.occurred_at);return (!year||d.getFullYear()===Number(year))&&(!month||d.getMonth()+1===Number(month))&&(!day||d.getDate()===Number(day))})
  setRows(filtered)
  setArchivedRows(archivedFiltered)
  const allRows=[...filtered,...archivedFiltered]
  const ids=[...new Set(allRows.map(x=>x.user_id).filter(Boolean) as string[])]
  if(ids.length){const{data:p}=await supabase.from('profiles').select('id,full_name,role,employee_code').in('id',ids);setProfiles(Object.fromEntries(((p??[])as Profile[]).map(x=>[x.id,x])))}
  const idsFor=(k:string)=>[...new Set(allRows.map(x=>x.old_data?.[k]).filter(v=>typeof v==='string'&&v))] as string[]
  const [cu,ca,br,em,pa]=await Promise.all([idsFor('customer_id').length?supabase.from('customers').select('id,full_name').in('id',idsFor('customer_id')):Promise.resolve({data:[]}),idsFor('car_id').length?supabase.from('cars').select('id,make,model,plate_number').in('id',idsFor('car_id')):Promise.resolve({data:[]}),idsFor('branch_id').length?supabase.from('branches').select('id,name').in('id',idsFor('branch_id')):Promise.resolve({data:[]}),idsFor('employee_id').length?supabase.from('employees').select('id,full_name').in('id',idsFor('employee_id')):Promise.resolve({data:[]}),idsFor('part_id').length?supabase.from('parts').select('id,name,part_number').in('id',idsFor('part_id')):Promise.resolve({data:[]})])
  const map:Record<string,string>={}
  ;(cu.data??[]).forEach((x:any)=>map[x.id]=x.full_name)
  ;(ca.data??[]).forEach((x:any)=>map[x.id]=[x.make,x.model,x.plate_number].filter(Boolean).join(' — '))
  ;(br.data??[]).forEach((x:any)=>map[x.id]=x.name)
  ;(em.data??[]).forEach((x:any)=>map[x.id]=x.full_name)
  ;(pa.data??[]).forEach((x:any)=>map[x.id]=(x.part_number?'SP-'+x.part_number+' — ':'')+x.name)
  setLookups(map)
  setLoading(false)
 }catch(e){setError(e instanceof Error?e.message:'حدث خطأ أثناء تحميل سجل المحذوفات');setLoading(false)}
 })()},[year,month,day])
 return <div className="mx-auto flex max-w-7xl flex-col">
  <div className="mb-5"><div className="flex items-center gap-2"><Trash2 className="size-6 text-destructive"/><h1 className="text-2xl font-bold">سجل المحذوفات</h1></div><p className="mt-1 text-muted-foreground">سجل محفوظ لكل ما تم حذفه، بالتفاصيل الأصلية قبل الحذف — للمدير فقط</p></div><div className="mb-5 flex flex-wrap gap-2"><button className="rounded-lg border bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">🗑️ المحذوفات الحالية</button><button onClick={()=>window.location.href="/deleted-records?tab=archive"} className="rounded-lg border bg-card px-4 py-2 text-sm font-medium">🗄️ المحذوفات المؤرشفة</button></div>
  <ResourceToolbar filters={[]} dateFilter={{enabled:true,year,month,day}} />
  {loading?<div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">جاري تحميل سجل المحذوفات...</div>:error?<div className="rounded-lg border border-destructive/40 bg-card p-8 text-center text-destructive">تعذر تحميل سجل المحذوفات: {error}</div>:(rows.length===0&&archivedRows.length===0)?<div className="rounded-lg border border-dashed bg-card p-10 text-center text-muted-foreground">لا توجد سجلات محذوفة في الفترة المحددة</div>:<div className="overflow-x-auto rounded-lg border bg-card"><table className="w-full text-sm"><thead className="border-b bg-muted/50"><tr><th className="px-4 py-3 text-start">التاريخ والوقت</th><th className="px-4 py-3 text-start">من قام بالحذف</th><th className="px-4 py-3 text-start">القسم</th><th className="px-4 py-3 text-start">السجل المحذوف</th><th className="min-w-[520px] px-4 py-3 text-start">كل التفاصيل قبل الحذف</th></tr></thead><tbody className="divide-y">{[...rows,...archivedRows].sort((a,b)=>new Date(b.occurred_at).getTime()-new Date(a.occurred_at).getTime()).map(row=>{const p=row.user_id?profiles[row.user_id]:undefined;const d=row.old_data??{};return <tr key={row.id} className="align-top hover:bg-muted/40"><td className="whitespace-nowrap px-4 py-3">{new Intl.DateTimeFormat('ar-EG-u-nu-latn',{dateStyle:'short',timeStyle:'short'}).format(new Date(row.occurred_at))}</td><td className="px-4 py-3"><div className="font-medium">{p?.full_name??'غير معروف'}</div><div className="text-xs text-muted-foreground">{p?.employee_code??''}</div></td><td className="px-4 py-3">{TABLE_LABELS[row.table_name]??row.table_name}</td><td className="px-4 py-3 font-medium">{titleFor(row)}<div className="mt-1 text-xs text-muted-foreground">سجل #{row.log_number}</div></td><td className="px-4 py-3"><div className="grid gap-1 sm:grid-cols-2">{Object.entries(d).filter(([k])=>!OMIT_FIELDS.has(k)).map(([k,v])=><div key={k} className="rounded border bg-muted/20 px-2 py-1"><span className="text-muted-foreground">{FIELD_LABELS[k]??k}: </span><span className="font-medium break-all">{formatValue(k,v,lookups)}</span></div>)}</div></td></tr>})}</tbody></table></div>}
 </div>
}
