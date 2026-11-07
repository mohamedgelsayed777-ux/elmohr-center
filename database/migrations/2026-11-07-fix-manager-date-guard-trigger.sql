create or replace function public.guard_manager_only_record_dates()
returns trigger
language plpgsql
set search_path = public
as $function$
declare
  old_date jsonb;
  new_date jsonb;
begin
  if tg_table_name = 'work_orders' then
    old_date := to_jsonb(old) -> 'opened_at';
    new_date := to_jsonb(new) -> 'opened_at';
  elsif tg_table_name = 'invoices' then
    old_date := to_jsonb(old) -> 'issued_at';
    new_date := to_jsonb(new) -> 'issued_at';
  else
    return new;
  end if;

  if new_date is distinct from old_date then
    if auth.uid() is null or coalesce(public.current_user_role(), '') <> 'manager' then
      raise exception 'MANAGER_DATE_EDIT_ONLY' using errcode = '42501';
    end if;
  end if;

  return new;
end;
$function$;