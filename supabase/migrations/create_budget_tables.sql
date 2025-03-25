-- Create budget_income table
create table if not exists budget_income (
  id uuid default gen_random_uuid() primary key,
  organization_id uuid references organizations(id) on delete cascade,
  scenario_id uuid references scenarios(id) on delete cascade,
  year int not null,
  month int not null check (month between 1 and 12),
  income_type text not null check (income_type in ('consultancy', 'saas')),
  description text not null,
  hours float,
  rate decimal(10,2),
  users int,
  module_price decimal(10,2),
  amount decimal(10,2) not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create budget_expenses table
create table if not exists budget_expenses (
  id uuid default gen_random_uuid() primary key,
  organization_id uuid references organizations(id) on delete cascade,
  scenario_id uuid references scenarios(id) on delete cascade,
  year int not null,
  month int not null check (month between 1 and 12),
  cost_category text not null,
  sub_category text,
  description text not null,
  amount decimal(10,2) not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add RLS policies
alter table budget_income enable row level security;
alter table budget_expenses enable row level security;

create policy "Users can view their organization's income"
  on budget_income for select
  using (organization_id in (
    select organization_id from organization_users
    where user_id = auth.uid()
  ));

create policy "Users can insert their organization's income"
  on budget_income for insert
  with check (organization_id in (
    select organization_id from organization_users
    where user_id = auth.uid()
  ));

create policy "Users can update their organization's income"
  on budget_income for update
  using (organization_id in (
    select organization_id from organization_users
    where user_id = auth.uid()
  ));

create policy "Users can delete their organization's income"
  on budget_income for delete
  using (organization_id in (
    select organization_id from organization_users
    where user_id = auth.uid()
  ));

create policy "Users can view their organization's expenses"
  on budget_expenses for select
  using (organization_id in (
    select organization_id from organization_users
    where user_id = auth.uid()
  ));

create policy "Users can insert their organization's expenses"
  on budget_expenses for insert
  with check (organization_id in (
    select organization_id from organization_users
    where user_id = auth.uid()
  ));

create policy "Users can update their organization's expenses"
  on budget_expenses for update
  using (organization_id in (
    select organization_id from organization_users
    where user_id = auth.uid()
  ));

create policy "Users can delete their organization's expenses"
  on budget_expenses for delete
  using (organization_id in (
    select organization_id from organization_users
    where user_id = auth.uid()
  )); 