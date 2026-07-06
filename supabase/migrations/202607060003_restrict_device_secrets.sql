revoke all on public.devices from anon, authenticated;

grant select (
  id,
  business_id,
  branch_id,
  name,
  active,
  last_seen_at,
  created_at
) on public.devices to authenticated;
