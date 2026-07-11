create table if not exists public.seo_metadata (
  path text primary key,
  title_tag text not null check (char_length(title_tag) between 1 and 70),
  meta_description text not null default '' check (char_length(meta_description) <= 150),
  keywords text[] not null default '{}'::text[] check (cardinality(keywords) <= 3),
  meta_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.seo_metadata enable row level security;

create policy "Anyone can view SEO metadata"
  on public.seo_metadata for select using (true);

create policy "Admins can manage SEO metadata"
  on public.seo_metadata for all to authenticated
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
