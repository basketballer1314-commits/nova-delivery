-- ============================================================
-- Nova Delivery — Migration 10 : Argent (paiements, grand livre en partie double)
-- Tous les montants en integer (FCFA).
-- ============================================================
set search_path = public, extensions;

create table public.payments (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid references public.orders(id) on delete set null,
  parcel_id       uuid references public.parcels(id) on delete set null,
  method          payment_method not null,
  amount          integer not null check (amount >= 0),
  status          text not null default 'EN_ATTENTE',
  provider_ref    text,
  idempotency_key text not null unique,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index payments_order_idx on public.payments (order_id);
create index payments_parcel_idx on public.payments (parcel_id);

create table public.payment_events (
  id          uuid primary key default gen_random_uuid(),
  payment_id  uuid not null references public.payments(id) on delete cascade,
  event_type  text not null,
  payload     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index payment_events_payment_idx on public.payment_events (payment_id);

-- Grand livre en partie double
create table public.ledger_entries (
  id             uuid primary key default gen_random_uuid(),
  transaction_id uuid not null,
  account_type   text not null,
  account_id     uuid,
  debit          integer not null default 0 check (debit >= 0),
  credit         integer not null default 0 check (credit >= 0),
  reference      text,
  created_at     timestamptz not null default now(),
  -- une ligne porte soit un débit soit un crédit (pas les deux, pas zéro)
  constraint ledger_entries_debit_xor_credit check (
    (debit > 0 and credit = 0) or (credit > 0 and debit = 0)
  )
);

create index ledger_entries_transaction_idx on public.ledger_entries (transaction_id);
create index ledger_entries_account_idx on public.ledger_entries (account_type, account_id);

-- Garantit Σdébit = Σcrédit par transaction (vérifié au COMMIT)
create constraint trigger ledger_balanced_check
  after insert or update or delete on public.ledger_entries
  deferrable initially deferred
  for each row execute function public.assert_ledger_balanced();

create table public.payouts (
  id            uuid primary key default gen_random_uuid(),
  courier_id    uuid not null references public.courier_profiles(id) on delete restrict,
  amount        integer not null check (amount >= 0),
  status        text not null default 'EN_ATTENTE',
  period_start  timestamptz,
  period_end    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index payouts_courier_idx on public.payouts (courier_id);

create table public.refunds (
  id          uuid primary key default gen_random_uuid(),
  payment_id  uuid references public.payments(id) on delete set null,
  order_id    uuid references public.orders(id) on delete set null,
  parcel_id   uuid references public.parcels(id) on delete set null,
  amount      integer not null check (amount >= 0),
  reason      text,
  status      text not null default 'EN_ATTENTE',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.cash_remittances (
  id          uuid primary key default gen_random_uuid(),
  courier_id  uuid not null references public.courier_profiles(id) on delete restrict,
  amount      integer not null check (amount >= 0),
  status      text not null default 'EN_ATTENTE',
  remitted_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index cash_remittances_courier_idx on public.cash_remittances (courier_id);
