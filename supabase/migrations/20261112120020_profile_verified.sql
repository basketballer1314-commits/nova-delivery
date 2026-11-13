-- ============================================================
-- Nova Delivery — Migration 20 : Compte vérifié (requis pour le contre-remboursement)
-- ============================================================

alter table public.profiles
  add column if not exists verified boolean not null default false;
