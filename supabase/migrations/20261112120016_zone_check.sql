-- ============================================================
-- Nova Delivery — Migration 16 : Contrôle de zone + liste d'attente
-- ============================================================
set search_path = public, extensions;

-- Renvoie l'id de la zone ACTIVE contenant le point, sinon null.
create or replace function public.check_zone(_lat double precision, _lng double precision)
returns integer
language sql
stable
security definer
set search_path = public, extensions
as $$
  select z.id
  from public.zones z
  where z.active
    and z.area is not null
    and ST_Contains(z.area::geometry, ST_SetSRID(ST_MakePoint(_lng, _lat), 4326))
  order by z.id
  limit 1;
$$;

-- Liste d'attente pour les demandes hors zone (jamais un cul-de-sac).
create table public.zone_waitlist (
  id         uuid primary key default gen_random_uuid(),
  phone      text not null check (phone ~ '^\+[0-9]{8,15}$'),
  lat        double precision,
  lng        double precision,
  quartier   text,
  note       text,
  created_at timestamptz not null default now()
);

create index zone_waitlist_created_idx on public.zone_waitlist (created_at);

alter table public.zone_waitlist enable row level security;

-- Tout utilisateur authentifié peut s'inscrire ; lecture réservée aux admins.
create policy zone_waitlist_insert on public.zone_waitlist for insert to authenticated
  with check (true);
create policy zone_waitlist_select on public.zone_waitlist for select to authenticated
  using (public.is_admin());
