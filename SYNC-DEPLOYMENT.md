# Falco cloud sync — runbook

## 1. Local development

1. Copy `backend/.env.example` to `backend/.env` and keep sync disabled initially.
2. Run the backend once. It creates `backend/backups/pre-sync-*.db`, adds UUIDs and queues the historical backfill.
3. Verify with `npm --workspace backend run reconcile`.
4. Copy `dashboard/.env.example` to `dashboard/.env.local`.

The local POS never calls Supabase directly. `GET /api/sync/status` and `POST /api/sync/run` expose status and a manual retry.

## 2. Supabase development project

1. Link the project with the Supabase CLI and run `supabase db push`.
2. Create the owner in Auth, then insert their membership using the business UUID from `supabase/seed.sql`.
3. Set `DEVICE_REGISTRATION_TOKEN` as an Edge Function secret and deploy the three functions.
4. Generate a UUID and a long random secret. Register the notebook once through `device-register`; never place the registration token in the app.
5. After registration succeeds, remove the temporary registration secret with `npx supabase secrets unset DEVICE_REGISTRATION_TOKEN`.
6. Put the returned device values in the backend environment and set `FALCO_SYNC_ENABLED=true`.

Example membership:

```sql
insert into public.business_memberships(business_id,user_id,role)
values ('00000000-0000-4000-8000-000000000001','OWNER_AUTH_UUID','owner');
```

## 3. Acceptance and rollout

- Keep the development project running in parallel for seven days.
- Compare local figures using `npm --workspace backend run reconcile` and the Supabase views.
- Investigate every dead letter before promoting the dashboard.
- Deploy `dashboard/` to Vercel with only the public URL and anon key.
- Production should use Supabase Pro, weekly external `pg_dump`, and the rotating local SQLite backups.

Alerts should fire when a device has not been seen for 30 minutes during business hours, five batches fail consecutively, or `sync_errors` receives rows.

## Security notes

- Never expose `SUPABASE_SERVICE_ROLE_KEY` outside Edge Functions.
- Rotate a device secret by calling `set_device_secret` from an authenticated administrative process.
- Revoke a lost device by setting `devices.active=false`.
- RLS is mandatory; test access with two separate users before adding another business.
