create table if not exists public.homepage_settings (
  id text primary key default 'main' check (id = 'main'),
  eyebrow_text text not null default 'Table tennis ratings for Aotearoa',
  heading_text text not null default 'Every match tells a player''s story.',
  subheading_text text not null default 'KiwiTTR brings New Zealand table tennis rankings, players, clubs, events and results together in one transparent rating platform.',
  primary_button_text text not null default 'Explore rankings',
  primary_button_url text not null default '/rankings',
  secondary_button_text text not null default 'Create an account',
  secondary_button_url text not null default '/register',
  hero_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.homepage_settings (id)
values ('main')
on conflict (id) do nothing;

alter table public.homepage_settings enable row level security;

create policy "Anyone can view homepage settings"
  on public.homepage_settings for select using (true);

create policy "Admins can manage homepage settings"
  on public.homepage_settings for all to authenticated
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
