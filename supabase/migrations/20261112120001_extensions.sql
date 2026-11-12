-- ============================================================
-- Nova Delivery — Migration 01 : Extensions
-- RLS : non activée ici (sécurité = prompt 2b)
-- ============================================================

create extension if not exists postgis with schema extensions;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;
