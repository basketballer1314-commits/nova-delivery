-- ============================================================
-- Nova Delivery — Migration 08 : Commandes (repas) et colis
-- Montants en integer (FCFA). pricing_snapshot fige le calcul serveur.
-- ============================================================
set search_path = public, extensions;

create table public.orders (
  id                  uuid primary key default gen_random_uuid(),
  customer_id         uuid not null references public.profiles(id) on delete restrict,
  restaurant_id       uuid references public.restaurants(id) on delete restrict,
  status              order_status not null default 'EN_ATTENTE_PAIEMENT',
  delivery_address_id uuid references public.addresses(id) on delete set null,
  zone_from           integer references public.zones(id) on delete set null,
  zone_to             integer references public.zones(id) on delete set null,
  payment_method      payment_method,
  items_total         integer not null default 0 check (items_total >= 0),
  delivery_fee        integer not null default 0 check (delivery_fee >= 0),
  service_fee         integer not null default 0 check (service_fee >= 0),
  discount_total      integer not null default 0 check (discount_total >= 0),
  total               integer not null default 0 check (total >= 0),
  pricing_snapshot    jsonb not null default '{}'::jsonb,
  idempotency_key     text not null unique,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index orders_customer_idx on public.orders (customer_id);
create index orders_restaurant_idx on public.orders (restaurant_id);
create index orders_status_idx on public.orders (status);

create table public.order_items (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references public.orders(id) on delete cascade,
  menu_item_id     uuid references public.menu_items(id) on delete set null,
  name_snapshot    text not null,
  unit_price       integer not null check (unit_price >= 0),
  quantity         integer not null default 1 check (quantity > 0),
  options_snapshot jsonb not null default '[]'::jsonb,
  line_total       integer not null check (line_total >= 0),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index order_items_order_idx on public.order_items (order_id);

create table public.parcels (
  id                 uuid primary key default gen_random_uuid(),
  sender_id          uuid not null references public.profiles(id) on delete restrict,
  status             parcel_status not null default 'DEVIS',
  pickup_address_id  uuid references public.addresses(id) on delete set null,
  dropoff_address_id uuid references public.addresses(id) on delete set null,
  zone_from          integer references public.zones(id) on delete set null,
  zone_to            integer references public.zones(id) on delete set null,
  weight_kg          numeric(5,2) check (weight_kg >= 0),
  declared_value     integer not null default 0 check (declared_value >= 0),
  cod_amount         integer not null default 0 check (cod_amount >= 0),
  recipient_name     text not null,
  recipient_phone    text not null check (recipient_phone ~ '^\+[0-9]{8,15}$'),
  tracking_token     text not null unique default encode(gen_random_bytes(12), 'hex'),
  payment_method     payment_method,
  price              integer not null default 0 check (price >= 0),
  pricing_snapshot   jsonb not null default '{}'::jsonb,
  idempotency_key    text not null unique,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index parcels_sender_idx on public.parcels (sender_id);
create index parcels_status_idx on public.parcels (status);
