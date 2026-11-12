-- ============================================================
-- Nova Delivery — Migration 11 : Commercial, qualité, système
-- ============================================================

create table public.promotions (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique,
  description     text,
  discount_type   text not null default 'fixed' check (discount_type in ('fixed','percent')),
  discount_value  integer not null check (discount_value >= 0),
  valid_from      timestamptz not null default now(),
  valid_to        timestamptz,
  max_redemptions integer,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table public.promo_redemptions (
  id          uuid primary key default gen_random_uuid(),
  promo_id    uuid not null references public.promotions(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  order_id    uuid references public.orders(id) on delete set null,
  redeemed_at timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

create index promo_redemptions_promo_idx on public.promo_redemptions (promo_id);
create index promo_redemptions_user_idx on public.promo_redemptions (user_id);

create table public.referrals (
  id          uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  referred_id uuid references public.profiles(id) on delete set null,
  code        text not null,
  status      text not null default 'EN_ATTENTE',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index referrals_referrer_idx on public.referrals (referrer_id);

create table public.ratings (
  id            uuid primary key default gen_random_uuid(),
  rater_id      uuid not null references public.profiles(id) on delete cascade,
  rated_user_id uuid references public.profiles(id) on delete set null,
  order_id      uuid references public.orders(id) on delete set null,
  parcel_id     uuid references public.parcels(id) on delete set null,
  score         smallint not null check (score between 1 and 5),
  comment       text,
  created_at    timestamptz not null default now()
);

create table public.tickets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  subject     text not null,
  status      text not null default 'OUVERT',
  priority    text not null default 'NORMALE',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index tickets_user_idx on public.tickets (user_id);

create table public.ticket_events (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid not null references public.tickets(id) on delete cascade,
  author_id   uuid references public.profiles(id) on delete set null,
  event_type  text not null default 'MESSAGE',
  message     text,
  created_at  timestamptz not null default now()
);

create index ticket_events_ticket_idx on public.ticket_events (ticket_id);

create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        text not null,
  title       text,
  body        text,
  data        jsonb not null default '{}'::jsonb,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id);

create table public.push_tokens (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  token       text not null unique,
  platform    text not null default 'expo',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index push_tokens_user_idx on public.push_tokens (user_id);

create table public.admin_audit_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.profiles(id) on delete set null,
  action      text not null,
  entity_type text,
  entity_id   uuid,
  payload     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index admin_audit_logs_entity_idx on public.admin_audit_logs (entity_type, entity_id);

-- Paramètres clé/valeur (marque, délais, plafonds…)
create table public.settings (
  key         text primary key,
  value       jsonb not null,
  description text,
  updated_at  timestamptz not null default now()
);
