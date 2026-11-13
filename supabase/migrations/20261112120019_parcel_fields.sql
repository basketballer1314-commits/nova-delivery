-- ============================================================
-- Nova Delivery — Migration 19 : Champs colis supplémentaires
-- ============================================================

alter table public.parcels
  add column if not exists category text,
  add column if not exists size text check (size in ('S','M','L')),
  add column if not exists otp_hash text,                       -- sha256 du code de remise 4 chiffres
  add column if not exists prohibited_ack boolean not null default false; -- « aucun objet interdit »
