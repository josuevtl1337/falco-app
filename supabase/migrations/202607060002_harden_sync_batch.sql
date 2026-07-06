create or replace function public.apply_sync_batch(
  p_device_id uuid,
  p_batch_id uuid,
  p_mutations jsonb
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  m jsonb;
  dev public.devices;
  mid uuid;
  entity_name text;
  operation_name text;
  local_id bigint;
  source_version_value bigint;
  accepted jsonb := '[]'::jsonb;
  duplicates jsonb := '[]'::jsonb;
  rejected jsonb := '[]'::jsonb;
  allowed_entities constant text[] := array['payment_methods','menu_category','menu_items','customers','coffees','suppliers','raw_materials','recipes','recipe_ingredients','cost_products','fixed_costs','stock_products','stock_menu_item_map','services','installments','orders','order_items','customer_account_payments','report_expenses','stock_movements','cash_register_shifts','service_payments','installment_payments','price_history','calibrations','cash_register_stock_items','cash_register_stock_item_menu_map'];
begin
  if jsonb_typeof(p_mutations) <> 'array'
     or jsonb_array_length(p_mutations) < 1
     or jsonb_array_length(p_mutations) > 200 then
    raise exception 'Mutation batch must contain between 1 and 200 entries';
  end if;

  select * into dev from public.devices where id=p_device_id and active;
  if not found then raise exception 'Unknown or inactive device'; end if;

  insert into public.sync_batches(id,device_id,mutation_count)
  values(p_batch_id,p_device_id,jsonb_array_length(p_mutations))
  on conflict(id) do nothing;

  for m in select * from jsonb_array_elements(p_mutations) loop
    mid := null;
    begin
      mid := (m->>'mutation_id')::uuid;
      entity_name := m->>'entity_type';
      operation_name := m->>'operation';
      source_version_value := (m->>'source_version')::bigint;
      local_id := nullif(coalesce(m->'payload'->>'id',m->'payload'->>'category_id'),'')::bigint;

      if entity_name is null or not (entity_name = any(allowed_entities)) then
        raise exception 'Unsupported entity type';
      end if;
      if operation_name not in ('upsert','delete') then
        raise exception 'Unsupported operation';
      end if;
      if source_version_value < 1 then
        raise exception 'Invalid source version';
      end if;
      if jsonb_typeof(m->'payload') <> 'object' or local_id is null then
        raise exception 'Invalid mutation payload';
      end if;

      if exists(select 1 from public.processed_mutations where mutation_id=mid) then
        duplicates := duplicates || jsonb_build_array(mid);
        continue;
      end if;

      insert into public.synced_records(
        id,business_id,branch_id,source_device_id,source_table,source_local_id,
        source_version,data,source_created_at,deleted_at
      )
      values(
        (m->>'entity_public_id')::uuid,dev.business_id,dev.branch_id,dev.id,
        entity_name,local_id,source_version_value,m->'payload',m->>'occurred_at',
        case when operation_name='delete' then now() end
      )
      on conflict(id) do update set
        data=excluded.data,
        source_version=excluded.source_version,
        updated_at=now(),
        deleted_at=excluded.deleted_at
      where public.synced_records.source_version <= excluded.source_version;

      insert into public.processed_mutations(mutation_id,batch_id,device_id)
      values(mid,p_batch_id,p_device_id);
      accepted := accepted || jsonb_build_array(mid);
    exception when others then
      rejected := rejected || jsonb_build_array(jsonb_build_object(
        'mutation_id',coalesce(mid::text,m->>'mutation_id'),
        'code','invalid_payload','message',sqlerrm,'permanent',true
      ));
      insert into public.sync_errors(batch_id,device_id,mutation_id,code,message)
      values(p_batch_id,p_device_id,mid,'invalid_payload',sqlerrm);
    end;
  end loop;

  update public.sync_batches set
    accepted_count=jsonb_array_length(accepted)+jsonb_array_length(duplicates),
    rejected_count=jsonb_array_length(rejected)
  where id=p_batch_id;

  return jsonb_build_object(
    'batch_id',p_batch_id,
    'accepted',accepted,
    'duplicates',duplicates,
    'rejected',rejected,
    'server_time',now()
  );
end
$$;

revoke all on function public.apply_sync_batch(uuid,uuid,jsonb)
from public,anon,authenticated;
grant execute on function public.apply_sync_batch(uuid,uuid,jsonb)
to service_role;
