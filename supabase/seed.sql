-- Replace the owner UUID after creating the user in Supabase Auth.
insert into public.businesses(id,name) values('00000000-0000-4000-8000-000000000001','Falco') on conflict do nothing;
insert into public.branches(id,business_id,name) values('00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000001','Local principal') on conflict do nothing;
