-- ============================================================
-- Nova Delivery — Migration 15 : Journal d'envoi SMS (rate limit)
-- Utilisé par l'Edge Function send-sms (5 demandes / numéro / heure).
-- Accès service_role uniquement (RLS activée, aucune policy).
-- ============================================================

create table public.sms_send_log (
  id         uuid primary key default gen_random_uuid(),
  phone      text not null,
  created_at timestamptz not null default now()
);

create index sms_send_log_phone_time on public.sms_send_log (phone, created_at);

alter table public.sms_send_log enable row level security;
