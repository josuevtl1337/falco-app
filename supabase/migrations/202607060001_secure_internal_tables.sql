alter table public.profiles enable row level security;
alter table public.processed_mutations enable row level security;

create policy own_profile
on public.profiles
for select
to authenticated
using (id = auth.uid());

revoke all on public.processed_mutations from anon, authenticated;
grant select on public.profiles to authenticated;
