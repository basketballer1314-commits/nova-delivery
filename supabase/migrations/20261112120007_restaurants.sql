-- ============================================================
-- Nova Delivery — Migration 07 : Restaurants
-- ============================================================
set search_path = public, extensions;

create table public.restaurants (
  id                    uuid primary key default gen_random_uuid(),
  owner_id              uuid references public.profiles(id) on delete set null,
  name                  text not null,
  slug                  text not null unique,
  city_id               integer references public.cities(id) on delete restrict,
  zone_id               integer references public.zones(id) on delete set null,
  status                restaurant_status not null default 'EN_ATTENTE',
  phone                 text check (phone ~ '^\+[0-9]{8,15}$'),
  address               text,
  location              geography(Point, 4326),
  logo_path             text,
  commission_rate       numeric(5,2) not null default 10.00 check (commission_rate >= 0 and commission_rate <= 100),
  commission_valid_from timestamptz not null default now(),
  commission_valid_to   timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index restaurants_location_gist on public.restaurants using gist (location);
create index restaurants_city_idx on public.restaurants (city_id);

-- FK différée de user_roles (table créée en migration 05)
alter table public.user_roles
  add constraint fk_user_roles_restaurant
  foreign key (restaurant_id) references public.restaurants(id) on delete cascade;

create table public.restaurant_hours (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  weekday       smallint not null check (weekday between 0 and 6),
  open_time     time not null,
  close_time    time not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index restaurant_hours_restaurant_idx on public.restaurant_hours (restaurant_id);

create table public.restaurant_members (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  member_role   app_role not null default 'resto_staff',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (restaurant_id, user_id)
);

create table public.menu_categories (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name          text not null,
  position      integer not null default 0,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index menu_categories_restaurant_idx on public.menu_categories (restaurant_id);

create table public.menu_items (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  category_id   uuid references public.menu_categories(id) on delete set null,
  name          text not null,
  description   text,
  price         integer not null check (price >= 0),
  available     boolean not null default true,
  image_path    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index menu_items_restaurant_idx on public.menu_items (restaurant_id);
create index menu_items_category_idx on public.menu_items (category_id);

create table public.option_groups (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid not null references public.menu_items(id) on delete cascade,
  name        text not null,
  min_select  integer not null default 0 check (min_select >= 0),
  max_select  integer not null default 1 check (max_select >= min_select),
  required    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index option_groups_item_idx on public.option_groups (item_id);

create table public.options (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references public.option_groups(id) on delete cascade,
  name        text not null,
  price_delta integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index options_group_idx on public.options (group_id);
