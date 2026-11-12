-- ============================================================
-- Nova Delivery — Migration 06 : Livreurs
-- ============================================================
set search_path = public, extensions;

create table public.courier_profiles (
  id            uuid primary key references public.profiles(id) on delete cascade,
  status        courier_status not null default 'EN_ATTENTE',
  vehicle_type  text,
  plate         text,
  deposit       integer not null default 0 check (deposit >= 0),      -- caution (FCFA)
  cash_limit    integer not null default 30000 check (cash_limit >= 0),
  cash_in_hand  integer not null default 0 check (cash_in_hand >= 0),
  availability  courier_availability not null default 'HORS_LIGNE',
  last_location geography(Point, 4326),
  last_seen_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index courier_profiles_location_gist on public.courier_profiles using gist (last_location);
create index courier_profiles_availability_idx on public.courier_profiles (availability);

create table public.courier_documents (
  id          uuid primary key default gen_random_uuid(),
  courier_id  uuid not null references public.courier_profiles(id) on delete cascade,
  doc_type    text not null,
  file_path   text not null,
  status      text not null default 'EN_ATTENTE',
  verified_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index courier_documents_courier_idx on public.courier_documents (courier_id);

create table public.courier_shifts (
  id          uuid primary key default gen_random_uuid(),
  courier_id  uuid not null references public.courier_profiles(id) on delete cascade,
  started_at  timestamptz not null default now(),
  ended_at    timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index courier_shifts_courier_idx on public.courier_shifts (courier_id);
