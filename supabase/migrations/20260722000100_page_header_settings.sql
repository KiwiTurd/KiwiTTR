create table if not exists public.page_header_settings (
  id text primary key default 'main' check (id = 'main'),
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.page_header_settings (id)
values ('main')
on conflict (id) do nothing;

alter table public.page_header_settings enable row level security;

create policy "Anyone can view page header settings"
  on public.page_header_settings for select using (true);

create policy "Admins can manage page header settings"
  on public.page_header_settings for all to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );
