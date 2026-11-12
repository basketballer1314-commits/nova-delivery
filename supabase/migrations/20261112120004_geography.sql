-- ============================================================
-- Nova Delivery — Migration 04 : Géographie
-- ============================================================
set search_path = public, extensions;

-- Villes
create table public.cities (
  id          serial primary key,
  name        text not null,
  slug        text not null unique,
  region      text,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Zones (Mbour=1, Saly=2, Ngaparou=3, Somone=4, Malicounda/Warang/Nianing=5)
create table public.zones (
  id              integer primary key,
  city_id         integer references public.cities(id) on delete restrict,
  name            text not null,
  slug            text not null unique,
  number          integer not null unique,
  area            geography(Polygon, 4326),
  active          boolean not null default true,
  hours           jsonb not null default '{}'::jsonb,
  services_active text[] not null default array['food','parcel']::text[],
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index zones_area_gist on public.zones using gist (area);

-- Grille tarifaire par service et couple de zones
create table public.zone_prices (
  id          uuid primary key default gen_random_uuid(),
  service     delivery_job_type not null,
  from_zone   integer not null references public.zones(id) on delete restrict,
  to_zone     integer not null references public.zones(id) on delete restrict,
  price       integer not null check (price >= 0),
  valid_from  timestamptz not null default now(),
  valid_to    timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index zone_prices_lookup on public.zone_prices (service, from_zone, to_zone, valid_from);

-- un seul prix actif (valid_to null) par service + couple de zones
create unique index zone_prices_current_unique
  on public.zone_prices (service, from_zone, to_zone)
  where valid_to is null;
