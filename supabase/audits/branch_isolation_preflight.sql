-- READ-ONLY PREFLIGHT AUDIT ONLY.
-- This script performs SELECTs against PostgreSQL catalogs; it does not alter schema/data.
-- Run manually in Supabase SQL Editor when reviewing branch isolation. Do not paste an
-- unreviewed migration into production.

-- 1) Public tables and RLS state.
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r', 'p')
order by c.relname;

-- 2) Policies currently defined on public tables.
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_expression,
  with_check as check_expression
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 3) SECURITY DEFINER functions and EXECUTE grants.
-- Review each function before changing grants; some are part of legitimate app workflows.
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  p.prosecdef as security_definer,
  coalesce(p.proconfig::text, '[]') as function_settings,
  has_function_privilege('anon', p.oid, 'EXECUTE') as anon_can_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_can_execute,
  pg_get_functiondef(p.oid) as definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prosecdef
order by p.proname, arguments;

-- 4) Public tables that do not have a branch_id column.
-- These may be shared reference tables OR child tables whose scope must be inherited
-- from a parent record. Do not automatically add branch_id to every result.
select
  c.relname as table_name
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r', 'p')
  and not exists (
    select 1
    from pg_attribute a
    where a.attrelid = c.oid
      and a.attname = 'branch_id'
      and a.attnum > 0
      and not a.attisdropped
  )
order by c.relname;

-- 5) Branch assignment gaps in key operational tables.
-- Results identify rows requiring a human decision; never auto-assign based on guesses.
select 'customers' as table_name, count(*) as unassigned_rows
from public.customers where branch_id is null
union all
select 'employees', count(*) from public.employees where branch_id is null
union all
select 'parts', count(*) from public.parts where branch_id is null
union all
select 'work_orders', count(*) from public.work_orders where branch_id is null
union all
select 'invoices', count(*) from public.invoices where branch_id is null
union all
select 'expenses', count(*) from public.expenses where branch_id is null
order by table_name;
