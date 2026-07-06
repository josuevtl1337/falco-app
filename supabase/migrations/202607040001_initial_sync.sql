create extension if not exists pgcrypto;
create table public.businesses (id uuid primary key default gen_random_uuid(),name text not null,timezone text not null default 'America/Argentina/Buenos_Aires',created_at timestamptz not null default now());
create table public.branches (id uuid primary key default gen_random_uuid(),business_id uuid not null references public.businesses on delete cascade,name text not null,created_at timestamptz not null default now());
create table public.profiles (id uuid primary key references auth.users on delete cascade,display_name text,created_at timestamptz not null default now());
create table public.business_memberships (business_id uuid not null references public.businesses on delete cascade,user_id uuid not null references auth.users on delete cascade,role text not null default 'owner' check(role in('owner','admin','operator','viewer')),primary key(business_id,user_id));
create table public.devices (id uuid primary key,business_id uuid not null references public.businesses on delete cascade,branch_id uuid not null references public.branches on delete cascade,name text not null,secret_hash text not null,active boolean not null default true,last_seen_at timestamptz,created_at timestamptz not null default now());
create table public.sync_batches (id uuid primary key,device_id uuid not null references public.devices,received_at timestamptz not null default now(),mutation_count integer not null,accepted_count integer not null default 0,rejected_count integer not null default 0);
create table public.processed_mutations (mutation_id uuid primary key,batch_id uuid not null references public.sync_batches,device_id uuid not null references public.devices,processed_at timestamptz not null default now());
create table public.sync_errors (id bigint generated always as identity primary key,batch_id uuid,device_id uuid,mutation_id uuid,code text not null,message text not null,created_at timestamptz not null default now());
create table public.synced_records (id uuid primary key,business_id uuid not null references public.businesses on delete cascade,branch_id uuid references public.branches on delete cascade,source_device_id uuid not null references public.devices,source_table text not null,source_local_id bigint,source_version bigint not null,data jsonb not null default '{}'::jsonb,source_created_at text,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),deleted_at timestamptz,unique(source_device_id,source_table,source_local_id));
create index synced_records_lookup on public.synced_records(business_id,source_table,deleted_at);
create index synced_records_data on public.synced_records using gin(data);

create or replace function public.is_business_member(target uuid) returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.business_memberships where business_id=target and user_id=auth.uid()) $$;
alter table public.businesses enable row level security; alter table public.branches enable row level security; alter table public.business_memberships enable row level security; alter table public.devices enable row level security; alter table public.sync_batches enable row level security; alter table public.sync_errors enable row level security; alter table public.synced_records enable row level security;
create policy member_business on public.businesses for select using(public.is_business_member(id));
create policy member_branches on public.branches for select using(public.is_business_member(business_id));
create policy own_membership on public.business_memberships for select using(user_id=auth.uid());
create policy member_devices on public.devices for select using(public.is_business_member(business_id));
create policy member_records on public.synced_records for select using(public.is_business_member(business_id));
create policy member_batches on public.sync_batches for select using(exists(select 1 from public.devices d where d.id=device_id and public.is_business_member(d.business_id)));
create policy member_errors on public.sync_errors for select using(exists(select 1 from public.devices d where d.id=device_id and public.is_business_member(d.business_id)));

create or replace function public.authenticate_device(p_device_id uuid,p_secret text) returns table(business_id uuid,branch_id uuid) language sql security definer set search_path='' as $$ update public.devices set last_seen_at=now() where id=p_device_id and active and secret_hash=extensions.crypt(p_secret,secret_hash) returning devices.business_id,devices.branch_id $$;
create or replace function public.set_device_secret(p_device_id uuid,p_secret text) returns void language sql security definer set search_path='' as $$ update public.devices set secret_hash=extensions.crypt(p_secret,extensions.gen_salt('bf')) where id=p_device_id $$;
revoke all on function public.authenticate_device(uuid,text),public.set_device_secret(uuid,text) from public,anon,authenticated;
grant execute on function public.authenticate_device(uuid,text),public.set_device_secret(uuid,text) to service_role;

create or replace function public.apply_sync_batch(p_device_id uuid,p_batch_id uuid,p_mutations jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare m jsonb; dev public.devices; accepted jsonb='[]'; duplicates jsonb='[]'; rejected jsonb='[]'; mid uuid;
begin
 select * into dev from public.devices where id=p_device_id and active; if not found then raise exception 'Unknown device'; end if;
 insert into public.sync_batches(id,device_id,mutation_count) values(p_batch_id,p_device_id,jsonb_array_length(p_mutations));
 for m in select * from jsonb_array_elements(p_mutations) loop begin
  mid:=(m->>'mutation_id')::uuid;
  if exists(select 1 from public.processed_mutations where mutation_id=mid) then duplicates:=duplicates||jsonb_build_array(mid); continue; end if;
  insert into public.synced_records(id,business_id,branch_id,source_device_id,source_table,source_local_id,source_version,data,source_created_at,deleted_at)
  values((m->>'entity_public_id')::uuid,dev.business_id,dev.branch_id,dev.id,m->>'entity_type',nullif(coalesce(m->'payload'->>'id',m->'payload'->>'category_id'),'')::bigint,(m->>'source_version')::bigint,m->'payload',m->>'occurred_at',case when m->>'operation'='delete' then now() end)
  on conflict(id) do update set data=excluded.data,source_version=excluded.source_version,updated_at=now(),deleted_at=excluded.deleted_at where public.synced_records.source_version<=excluded.source_version;
  insert into public.processed_mutations values(mid,p_batch_id,p_device_id,now()); accepted:=accepted||jsonb_build_array(mid);
 exception when others then rejected:=rejected||jsonb_build_array(jsonb_build_object('mutation_id',m->>'mutation_id','code','invalid_payload','message',sqlerrm,'permanent',true)); insert into public.sync_errors(batch_id,device_id,mutation_id,code,message) values(p_batch_id,p_device_id,mid,'invalid_payload',sqlerrm); end; end loop;
 update public.sync_batches set accepted_count=jsonb_array_length(accepted)+jsonb_array_length(duplicates),rejected_count=jsonb_array_length(rejected) where id=p_batch_id;
 return jsonb_build_object('batch_id',p_batch_id,'accepted',accepted,'duplicates',duplicates,'rejected',rejected,'server_time',now());
end $$;
revoke all on function public.apply_sync_batch(uuid,uuid,jsonb) from public,anon,authenticated; grant execute on function public.apply_sync_batch(uuid,uuid,jsonb) to service_role;

create or replace view public.dashboard_orders with(security_invoker=true) as select id,business_id,branch_id,data->>'status' status,coalesce((data->>'total_amount')::numeric,0) total_amount,data->>'shift' shift,data->>'payment_method_id' payment_method_id,source_created_at,deleted_at from public.synced_records where source_table='orders';
create or replace view public.dashboard_expenses with(security_invoker=true) as select id,business_id,branch_id,coalesce((data->>'amount')::numeric,0) amount,data->>'category' category,data->>'description' description,data->>'date' expense_date,deleted_at from public.synced_records where source_table='report_expenses';
create or replace view public.dashboard_stock with(security_invoker=true) as select id,business_id,branch_id,data->>'name' name,coalesce((data->>'current_stock')::numeric,0) current_stock,coalesce((data->>'alert_threshold')::numeric,0) alert_threshold,coalesce((data->>'active')::int,1)=1 active,deleted_at from public.synced_records where source_table='stock_products';
create or replace view public.dashboard_catalog with(security_invoker=true) as select id,business_id,data->>'name' name,coalesce((data->>'price')::numeric,0) price,coalesce((data->>'is_active')::int,1)=1 active,data->>'category_id' category_id,deleted_at from public.synced_records where source_table='menu_items';
create or replace view public.dashboard_cash_shifts with(security_invoker=true) as select id,business_id,branch_id,data->>'status' status,data->>'date' shift_date,data->>'shift' shift,coalesce((data->>'cash_start')::numeric,0) cash_start,coalesce((data->>'cash_end')::numeric,0) cash_end,coalesce((data->>'bank_start')::numeric,0) bank_start,coalesce((data->>'bank_end')::numeric,0) bank_end,coalesce((data->>'total_sales')::numeric,0) total_sales,coalesce((data->>'order_count')::int,0) order_count,deleted_at from public.synced_records where source_table='cash_register_shifts';
grant select on public.dashboard_orders,public.dashboard_expenses,public.dashboard_stock,public.dashboard_catalog,public.dashboard_cash_shifts to authenticated;
grant select on public.businesses,public.branches,public.business_memberships,public.devices,public.sync_batches,public.sync_errors,public.synced_records to authenticated;
