alter table public.homepage_settings
  add column if not exists hero_slides jsonb not null default '[]'::jsonb;

update public.homepage_settings
set hero_slides = jsonb_build_array(
  jsonb_build_object(
    'id', 'primary',
    'eyebrowText', eyebrow_text,
    'headingText', heading_text,
    'subheadingText', subheading_text,
    'primaryButtonText', primary_button_text,
    'primaryButtonUrl', primary_button_url,
    'secondaryButtonText', secondary_button_text,
    'secondaryButtonUrl', secondary_button_url,
    'heroImageUrl', coalesce(hero_image_url, ''),
    'mobileHeroImageUrl', '',
    'slateFade', true,
    'showKoru', true
  )
)
where jsonb_array_length(hero_slides) = 0;

alter table public.homepage_settings
  drop constraint if exists homepage_settings_hero_slides_array;

alter table public.homepage_settings
  add constraint homepage_settings_hero_slides_array
  check (
    jsonb_typeof(hero_slides) = 'array'
    and jsonb_array_length(hero_slides) > 0
  );
