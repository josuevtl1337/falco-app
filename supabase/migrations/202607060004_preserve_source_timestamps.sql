create or replace function public.normalize_synced_record_timestamp()
returns trigger
language plpgsql
set search_path=''
as $$
begin
  new.source_created_at := coalesce(
    new.data->>'created_at',
    new.data->>'opened_at',
    new.data->>'date',
    new.source_created_at
  );
  return new;
end
$$;

revoke all on function public.normalize_synced_record_timestamp()
from public,anon,authenticated;

create trigger normalize_synced_record_timestamp
before insert or update of data,source_created_at
on public.synced_records
for each row
execute function public.normalize_synced_record_timestamp();
