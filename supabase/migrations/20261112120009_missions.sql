-- ============================================================
-- Nova Delivery — Migration 09 : Missions et historique de statut
-- ============================================================
set search_path = public, extensions;

create table public.delivery_jobs (
  id              uuid primary key default gen_random_uuid(),
  job_type        delivery_job_type not null,
  order_id        uuid references public.orders(id) on delete cascade,
  parcel_id       uuid references public.parcels(id) on delete cascade,
  courier_id      uuid references public.courier_profiles(id) on delete set null,
  status          text not null default 'ASSIGNATION',
  otp_hash        text,
  pickup_photo_path   text,
  dropoff_photo_path  text,
  payout          integer not null default 0 check (payout >= 0),
  assigned_at     timestamptz,
  picked_up_at    timestamptz,
  delivered_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- exactement une référence selon le type
  constraint delivery_jobs_reference_chk check (
    (job_type = 'food'   and order_id is not null and parcel_id is null) or
    (job_type = 'parcel' and parcel_id is not null and order_id is null)
  )
);

create index delivery_jobs_courier_idx on public.delivery_jobs (courier_id);
create index delivery_jobs_order_idx on public.delivery_jobs (order_id);
create index delivery_jobs_parcel_idx on public.delivery_jobs (parcel_id);

create table public.job_offers (
  id           uuid primary key default gen_random_uuid(),
  job_id       uuid not null references public.delivery_jobs(id) on delete cascade,
  courier_id   uuid not null references public.courier_profiles(id) on delete cascade,
  sent_at      timestamptz not null default now(),
  expires_at   timestamptz not null,
  response     text not null default 'PENDING' check (response in ('PENDING','ACCEPTED','DECLINED','EXPIRED')),
  responded_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index job_offers_job_idx on public.job_offers (job_id);
create index job_offers_courier_idx on public.job_offers (courier_id);

-- Historique de statut (auteur, date, position si dispo) pour orders, parcels, delivery_jobs
create table public.status_history (
  id          uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id   uuid not null,
  from_status text,
  to_status   text not null,
  changed_by  uuid references public.profiles(id) on delete set null,
  position    geography(Point, 4326),
  note        text,
  created_at  timestamptz not null default now()
);

create index status_history_entity_idx on public.status_history (entity_type, entity_id);
create index status_history_position_gist on public.status_history using gist (position);
