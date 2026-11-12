-- ============================================================
-- Nova Delivery — Migration 05 : Comptes
-- ============================================================
set search_path = public, extensions;

-- Profils (1-1 avec auth.users)
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  phone       text unique check (phone ~ '^\+[0-9]{8,15}$'),
  full_name   text,
  language    text not null default 'fr' check (language in ('fr', 'en')),
  status      text not null default 'active',
  avatar_path text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Rôles (un utilisateur peut avoir plusieurs rôles, éventuellement par ville / restaurant)
create table public.user_roles (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  role          app_role not null,
  city_id       integer references public.cities(id) on delete set null,
  restaurant_id uuid, -- FK ajoutée en migration 07 (restaurants pas encore créée)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, role, restaurant_id)
);

create index user_roles_user_idx on public.user_roles (user_id);

-- Adresses
create table public.addresses (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references public.profiles(id) on delete cascade,
  label                text,
  location             geography(Point, 4326),
  quartier             text,
  landmark_description text,
  floor_gate           text,
  photo_path           text,
  audio_path           text,
  zone_id              integer references public.zones(id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index addresses_location_gist on public.addresses using gist (location);
create index addresses_user_idx on public.addresses (user_id);

-- Création du profil à l'inscription
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
