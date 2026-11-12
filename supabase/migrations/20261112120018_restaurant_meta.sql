-- ============================================================
-- Nova Delivery — Migration 18 : Métadonnées restaurant (note, délai)
-- Affichées dans la liste des restaurants.
-- ============================================================

alter table public.restaurants
  add column if not exists prep_time_minutes integer not null default 25 check (prep_time_minutes >= 0),
  add column if not exists rating_avg numeric(2,1) check (rating_avg >= 0 and rating_avg <= 5),
  add column if not exists rating_count integer not null default 0 check (rating_count >= 0);
