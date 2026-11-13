-- ============================================================
-- Nova Delivery — Migration 25 : Verrouillage des exécutions dispatch
-- Par défaut Postgres accorde EXECUTE à PUBLIC → PostgREST exposerait les
-- fonctions internes (dispatch_tick, record_admin_alert, make_offer…) à anon.
-- On révoque PUBLIC et on n'accorde que : service_role (backend/cron) partout,
-- authenticated uniquement sur les RPC livreur (qui vérifient auth.uid()).
-- ============================================================
set search_path = public, extensions;

-- ---------- Fonctions internes : backend/cron seulement ----------
do $$
declare
  f text;
  internal text[] := array[
    'dispatch_setting(text, numeric)',
    'courier_eta_minutes(geography, geography)',
    'dispatch_queue_sms(uuid, text, text)',
    'record_admin_alert(text, text, text, uuid, uuid, uuid, jsonb)',
    'dispatch_eligible_couriers(uuid)',
    'dispatch_make_offer(uuid)',
    'start_courier_search(uuid)',
    'dispatch_tick()',
    'on_order_accepted()',
    'on_parcel_confirmed()'
  ];
begin
  foreach f in array internal loop
    execute format('revoke all on function public.%s from public', f);
    execute format('grant execute on function public.%s to service_role', f);
  end loop;
end $$;

-- ---------- RPC livreur : appelables par le client authentifié ----------
do $$
declare
  f text;
  client_rpc text[] := array[
    'courier_accept_offer(uuid)',
    'courier_decline_offer(uuid)',
    'courier_cancel_job(uuid, text)'
  ];
begin
  foreach f in array client_rpc loop
    execute format('revoke all on function public.%s from public', f);
    execute format('grant execute on function public.%s to authenticated, service_role', f);
  end loop;
end $$;
