-- ============================================================
-- Nova Delivery — Migration 17 : RPC my_addresses()
-- Renvoie les adresses de l'utilisateur avec lat/lng décodées.
-- SECURITY INVOKER → la RLS de public.addresses s'applique.
-- ============================================================
set search_path = public, extensions;

create or replace function public.my_addresses()
returns table (
  id        uuid,
  label     text,
  quartier  text,
  zone_id   integer,
  lat       double precision,
  lng       double precision
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select
    a.id,
    a.label,
    a.quartier,
    a.zone_id,
    ST_Y(a.location::geometry) as lat,
    ST_X(a.location::geometry) as lng
  from public.addresses a
  where a.user_id = auth.uid()
  order by a.created_at desc;
$$;
