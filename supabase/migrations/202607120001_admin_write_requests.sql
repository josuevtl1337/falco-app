create table if not exists public.admin_expense_requests (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses on delete cascade,
  branch_id uuid not null references public.branches on delete cascade,
  created_by uuid default auth.uid() references auth.users on delete set null,
  amount numeric not null check (amount > 0),
  category text not null check (category in ('servicios', 'proveedores', 'supermercado', 'otros')),
  description text not null default '',
  expense_date date not null,
  status text not null default 'pending' check (status in ('pending', 'applied', 'rejected')),
  source_device_id uuid references public.devices,
  local_public_id uuid,
  error_message text,
  created_at timestamptz not null default now(),
  applied_at timestamptz
);

create table if not exists public.admin_stock_adjustment_requests (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses on delete cascade,
  branch_id uuid not null references public.branches on delete cascade,
  created_by uuid default auth.uid() references auth.users on delete set null,
  stock_product_public_id uuid not null,
  stock_product_name text not null default '',
  mode text not null check (mode in ('set', 'delta')),
  quantity numeric not null,
  reason text not null default 'Ajuste desde dashboard',
  note text not null default '',
  status text not null default 'pending' check (status in ('pending', 'applied', 'rejected')),
  source_device_id uuid references public.devices,
  local_public_id uuid,
  error_message text,
  created_at timestamptz not null default now(),
  applied_at timestamptz
);

create index if not exists admin_expense_requests_lookup
  on public.admin_expense_requests(business_id, branch_id, status, created_at);

create index if not exists admin_stock_adjustment_requests_lookup
  on public.admin_stock_adjustment_requests(business_id, branch_id, status, created_at);

alter table public.admin_expense_requests enable row level security;
alter table public.admin_stock_adjustment_requests enable row level security;

drop policy if exists member_select_admin_expense_requests on public.admin_expense_requests;
create policy member_select_admin_expense_requests
  on public.admin_expense_requests
  for select
  using (public.is_business_member(business_id));

drop policy if exists member_insert_admin_expense_requests on public.admin_expense_requests;
create policy member_insert_admin_expense_requests
  on public.admin_expense_requests
  for insert
  with check (
    public.is_business_member(business_id)
    and created_by = auth.uid()
    and status = 'pending'
  );

drop policy if exists member_select_admin_stock_adjustment_requests on public.admin_stock_adjustment_requests;
create policy member_select_admin_stock_adjustment_requests
  on public.admin_stock_adjustment_requests
  for select
  using (public.is_business_member(business_id));

drop policy if exists member_insert_admin_stock_adjustment_requests on public.admin_stock_adjustment_requests;
create policy member_insert_admin_stock_adjustment_requests
  on public.admin_stock_adjustment_requests
  for insert
  with check (
    public.is_business_member(business_id)
    and created_by = auth.uid()
    and status = 'pending'
  );

grant select, insert on public.admin_expense_requests to authenticated;
grant select, insert on public.admin_stock_adjustment_requests to authenticated;
