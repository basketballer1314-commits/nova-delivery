-- ============================================================
-- Nova Delivery — Migration 27 : Back-office /admin (RPC serveur)
-- Double validation au-delà d'un seuil (séparation des tâches), dispatch
-- manuel, édition de zones, métriques tableau de bord, recherche.
-- Toutes vérifient le rôle côté serveur (is_admin / is_finance_admin).
-- ============================================================
set search_path = public, extensions;

insert into settings (key, value) values
  ('double_validation_threshold_fcfa', '50000')
on conflict (key) do update set value = excluded.value;

-- ============================================================
-- Demandes d'approbation (double validation)
-- ============================================================
create table if not exists public.approval_requests (
  id            uuid primary key default gen_random_uuid(),
  action        text not null,
  amount        integer not null default 0 check (amount >= 0),
  payload       jsonb not null default '{}'::jsonb,
  status        text not null default 'EN_ATTENTE'
                  check (status in ('EN_ATTENTE','APPROUVE','REJETE','EXECUTE')),
  requested_by  uuid references public.profiles(id) on delete set null,
  approved_by   uuid references public.profiles(id) on delete set null,
  reason        text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  executed_at   timestamptz
);
create index if not exists approval_requests_status_idx on public.approval_requests (status, created_at);

alter table public.approval_requests enable row level security;
create policy approval_requests_select on public.approval_requests for select to authenticated
  using (public.is_finance_admin());

-- Exécute l'action sous-jacente une fois approuvée.
create or replace function public._execute_approval(_id uuid)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare r record; o record; v_key text;
begin
  select * into r from public.approval_requests where id = _id for update;
  if r is null or r.status = 'EXECUTE' then return; end if;
  v_key := 'approval:' || r.id;

  if r.action = 'payment_validate' then
    select * into o from public.orders where id = (r.payload->>'order_id')::uuid for update;
    if o.status = 'EN_ATTENTE_PAIEMENT' then
      insert into public.payments (order_id, method, amount, status, idempotency_key, provider_ref)
      values (o.id, o.payment_method, o.total, 'PAYE', 'manual:' || o.id, o.payment_ref)
      on conflict (idempotency_key) do update set status = 'PAYE';
      update public.orders set status = 'ENVOYEE_RESTAURANT' where id = o.id;
      perform public.post_ledger('mobile_capture', 'capture:' || o.id,
        jsonb_build_object('order_id', o.id, 'amount', o.total));
    end if;

  elsif r.action = 'refund' then
    perform public.post_ledger('refund', v_key, r.payload);
    insert into public.refunds (order_id, parcel_id, amount, reason, imputation, status)
    values (nullif(r.payload->>'order_id','')::uuid, nullif(r.payload->>'parcel_id','')::uuid,
            r.amount, r.payload->>'reason', r.payload->>'imputation', 'VALIDE');

  elsif r.action in ('resto_payout','courier_payout','cod_remittance','cash_remittance','seller_payout') then
    perform public.post_ledger(r.action, v_key, r.payload);

  else
    raise exception 'action inconnue : %', r.action;
  end if;

  update public.approval_requests set status = 'EXECUTE', executed_at = now() where id = _id;
end;
$$;

-- Crée une demande : exécute direct si < seuil, sinon attend un second valideur.
create or replace function public.finance_request(_action text, _amount integer, _payload jsonb)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare v_threshold integer; v_id uuid; v_status text;
begin
  if not public.is_finance_admin() then raise exception 'réservé à la finance'; end if;
  v_threshold := public.dispatch_setting('double_validation_threshold_fcfa', 50000)::int;

  insert into public.approval_requests (action, amount, payload, requested_by, status)
  values (_action, coalesce(_amount,0), coalesce(_payload,'{}'::jsonb), auth.uid(), 'EN_ATTENTE')
  returning id into v_id;

  if coalesce(_amount,0) < v_threshold then
    perform public._execute_approval(v_id);
    update public.approval_requests set approved_by = auth.uid() where id = v_id;
    v_status := 'EXECUTE';
  else
    v_status := 'EN_ATTENTE';
  end if;

  insert into public.admin_audit_logs (actor_id, action, entity_type, entity_id, payload)
  values (auth.uid(), 'finance_request:' || _action, 'approval_requests', v_id,
          jsonb_build_object('amount', _amount, 'status', v_status));
  return jsonb_build_object('id', v_id, 'status', v_status);
end;
$$;

-- Approuve (valideur ≠ demandeur).
create or replace function public.finance_approve(_request_id uuid)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare r record;
begin
  if not public.is_finance_admin() then raise exception 'réservé à la finance'; end if;
  select * into r from public.approval_requests where id = _request_id for update;
  if r is null then raise exception 'demande introuvable'; end if;
  if r.status <> 'EN_ATTENTE' then raise exception 'demande déjà traitée'; end if;
  if r.requested_by = auth.uid() then raise exception 'le demandeur ne peut pas valider sa propre demande'; end if;

  perform public._execute_approval(_request_id);
  update public.approval_requests set status = 'EXECUTE', approved_by = auth.uid() where id = _request_id;
  insert into public.admin_audit_logs (actor_id, action, entity_type, entity_id, payload)
  values (auth.uid(), 'finance_approve', 'approval_requests', _request_id, '{}'::jsonb);
end;
$$;

create or replace function public.finance_reject(_request_id uuid, _reason text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.is_finance_admin() then raise exception 'réservé à la finance'; end if;
  update public.approval_requests
     set status = 'REJETE', approved_by = auth.uid(), reason = _reason
   where id = _request_id and status = 'EN_ATTENTE';
  if not found then raise exception 'demande introuvable ou déjà traitée'; end if;
  insert into public.admin_audit_logs (actor_id, action, entity_type, entity_id, payload)
  values (auth.uid(), 'finance_reject', 'approval_requests', _request_id, jsonb_build_object('reason', _reason));
end;
$$;

-- ============================================================
-- Dispatch manuel (ops)
-- ============================================================
create or replace function public.admin_impose_job(_job_id uuid, _courier_id uuid)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare j record; v_payout integer;
begin
  if not public.is_admin() then raise exception 'réservé à l''administration'; end if;
  select * into j from public.delivery_jobs where id = _job_id for update;
  if j is null then raise exception 'mission introuvable'; end if;

  if j.order_id is not null then
    select coalesce((pricing_snapshot->>'courierShare')::int,0) into v_payout from public.orders where id = j.order_id;
  else
    select coalesce((pricing_snapshot->>'courierShare')::int,0) into v_payout from public.parcels where id = j.parcel_id;
  end if;

  update public.delivery_jobs
     set courier_id = _courier_id, assigned_at = now(), status = 'ASSIGNE',
         payout = coalesce(v_payout,0) + coalesce(j.bonus,0)
   where id = _job_id;
  update public.courier_profiles set availability = 'EN_MISSION' where id = _courier_id;
  update public.job_offers set response = 'EXPIRED', responded_at = now()
   where job_id = _job_id and response = 'PENDING';
  if j.order_id is not null then update public.orders set status='LIVREUR_ASSIGNE' where id=j.order_id;
  else update public.parcels set status='LIVREUR_ASSIGNE' where id=j.parcel_id; end if;

  insert into public.admin_audit_logs (actor_id, action, entity_type, entity_id, payload)
  values (auth.uid(), 'admin_impose_job', 'delivery_jobs', _job_id, jsonb_build_object('courier_id', _courier_id));
end;
$$;

create or replace function public.admin_offer_job(_job_id uuid, _courier_id uuid)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare v_timeout integer;
begin
  if not public.is_admin() then raise exception 'réservé à l''administration'; end if;
  v_timeout := public.dispatch_setting('offer_timeout_seconds', 45)::int;
  update public.job_offers set response='EXPIRED', responded_at=now() where job_id=_job_id and response='PENDING';
  insert into public.job_offers (job_id, courier_id, expires_at)
  values (_job_id, _courier_id, now() + make_interval(secs => v_timeout));
  update public.delivery_jobs set status='OFFRE' where id=_job_id;
  insert into public.admin_audit_logs (actor_id, action, entity_type, entity_id, payload)
  values (auth.uid(), 'admin_offer_job', 'delivery_jobs', _job_id, jsonb_build_object('courier_id', _courier_id));
end;
$$;

create or replace function public.admin_reassign_job(_job_id uuid, _courier_id uuid)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare j record;
begin
  if not public.is_admin() then raise exception 'réservé à l''administration'; end if;
  select courier_id into j from public.delivery_jobs where id=_job_id;
  perform public.admin_impose_job(_job_id, _courier_id);
end;
$$;

create or replace function public.admin_cancel_job(_job_id uuid, _reason text)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare j record;
begin
  if not public.is_admin() then raise exception 'réservé à l''administration'; end if;
  select * into j from public.delivery_jobs where id=_job_id for update;
  if j is null then raise exception 'mission introuvable'; end if;
  update public.delivery_jobs set status='ANNULEE', courier_id=null, assigned_at=null where id=_job_id;
  if j.courier_id is not null then
    update public.courier_profiles c set availability='EN_LIGNE_LIBRE'
     where c.id=j.courier_id
       and not exists (select 1 from public.delivery_jobs a where a.courier_id=c.id and a.status in ('ASSIGNE','RECUPERE'));
  end if;
  if j.order_id is not null then update public.orders set status='ANNULEE' where id=j.order_id;
  else update public.parcels set status='ANNULEE' where id=j.parcel_id; end if;
  insert into public.admin_audit_logs (actor_id, action, entity_type, entity_id, payload)
  values (auth.uid(), 'admin_cancel_job', 'delivery_jobs', _job_id, jsonb_build_object('reason', _reason));
end;
$$;

-- ============================================================
-- Validation livreurs / restaurants / vendeurs (ops & sales)
-- ============================================================
create or replace function public.admin_set_courier_status(_courier_id uuid, _status courier_status)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.is_admin() then raise exception 'réservé à l''administration'; end if;
  update public.courier_profiles set status = _status where id = _courier_id;
  insert into public.admin_audit_logs (actor_id, action, entity_type, entity_id, payload)
  values (auth.uid(), 'admin_set_courier_status', 'courier_profiles', _courier_id, jsonb_build_object('status', _status));
end;
$$;

create or replace function public.admin_set_restaurant_status(_restaurant_id uuid, _status restaurant_status)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.is_admin() then raise exception 'réservé à l''administration'; end if;
  update public.restaurants set status = _status where id = _restaurant_id;
  insert into public.admin_audit_logs (actor_id, action, entity_type, entity_id, payload)
  values (auth.uid(), 'admin_set_restaurant_status', 'restaurants', _restaurant_id, jsonb_build_object('status', _status));
end;
$$;

create or replace function public.admin_set_restaurant_seller(_restaurant_id uuid, _seller_id uuid, _pct numeric)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.is_admin() then raise exception 'réservé à l''administration'; end if;
  update public.restaurants set seller_id = _seller_id, seller_commission_pct = coalesce(_pct, 0)
   where id = _restaurant_id;
  insert into public.admin_audit_logs (actor_id, action, entity_type, entity_id, payload)
  values (auth.uid(), 'admin_set_restaurant_seller', 'restaurants', _restaurant_id, jsonb_build_object('seller_id', _seller_id, 'pct', _pct));
end;
$$;

-- ============================================================
-- Zones : édition du polygone
-- ============================================================
create or replace function public.admin_update_zone(_zone_id integer, _geojson jsonb)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.is_admin() then raise exception 'réservé à l''administration'; end if;
  update public.zones
     set area = ST_SetSRID(ST_GeomFromGeoJSON(_geojson::text), 4326)::geography
   where id = _zone_id;
  insert into public.admin_audit_logs (actor_id, action, entity_type, entity_id, payload)
  values (auth.uid(), 'admin_update_zone', 'zones', null, jsonb_build_object('zone_id', _zone_id));
end;
$$;

-- ============================================================
-- Tableau de bord : métriques + commandes par heure
-- ============================================================
create or replace function public.admin_dashboard_metrics()
returns jsonb language plpgsql stable security definer set search_path = public, extensions as $$
declare v_orders int; v_gain bigint; v_online int; v_delay numeric;
begin
  if not public.is_admin() then raise exception 'réservé à l''administration'; end if;
  select count(*) into v_orders from public.orders where created_at::date = current_date;
  select coalesce(sum(credit - debit),0) into v_gain from public.ledger_entries
   where created_at::date = current_date
     and account_type in ('platform_commission','platform_service_fee','platform_delivery_margin','platform_cod_fee');
  select count(*) into v_online from public.courier_profiles where availability in ('EN_LIGNE_LIBRE','EN_MISSION');
  select round(avg(prep_minutes),1) into v_delay from public.orders
   where created_at::date = current_date and prep_minutes is not null;
  return jsonb_build_object('orders_today', v_orders, 'app_gain_today', v_gain,
                            'couriers_online', v_online, 'avg_delay_min', coalesce(v_delay,0));
end;
$$;

create or replace function public.admin_orders_by_hour(_day date)
returns table (hour integer, food_count integer, parcel_count integer)
language sql stable security definer set search_path = public, extensions as $$
  select h.hour,
    (select count(*)::int from public.orders o
       where o.created_at::date = _day and extract(hour from o.created_at)::int = h.hour),
    (select count(*)::int from public.parcels p
       where p.created_at::date = _day and extract(hour from p.created_at)::int = h.hour)
  from generate_series(0,23) as h(hour)
  where public.is_admin();
$$;

-- ============================================================
-- Carte des opérations : livreurs + missions actives (lat/lng décodés)
-- ============================================================
create or replace function public.admin_live_map()
returns jsonb language plpgsql stable security definer set search_path = public, extensions as $$
declare v jsonb;
begin
  if not public.is_admin() then raise exception 'réservé à l''administration'; end if;
  select jsonb_build_object(
    'couriers', coalesce((select jsonb_agg(jsonb_build_object(
        'id', c.id, 'availability', c.availability,
        'lat', ST_Y(c.last_location::geometry), 'lng', ST_X(c.last_location::geometry)))
      from public.courier_profiles c
      where c.last_location is not null and c.availability <> 'HORS_LIGNE'), '[]'::jsonb),
    'jobs', coalesce((select jsonb_agg(jsonb_build_object(
        'id', dj.id, 'status', dj.status, 'job_type', dj.job_type,
        'lat', ST_Y(dj.pickup_location::geometry), 'lng', ST_X(dj.pickup_location::geometry)))
      from public.delivery_jobs dj
      where dj.pickup_location is not null and dj.status in ('EN_ATTENTE_RECHERCHE','RECHERCHE','OFFRE','ASSIGNE','RECUPERE')), '[]'::jsonb)
  ) into v;
  return v;
end;
$$;

-- ============================================================
-- Recherche par téléphone ou numéro
-- ============================================================
create or replace function public.admin_search(_q text)
returns jsonb language plpgsql stable security definer set search_path = public, extensions as $$
declare v jsonb;
begin
  if not public.is_admin() then raise exception 'réservé à l''administration'; end if;
  select jsonb_build_object(
    'orders', coalesce((select jsonb_agg(jsonb_build_object(
        'id', o.id, 'status', o.status, 'total', o.total, 'phone', pr.phone,
        'created_at', o.created_at) order by o.created_at desc)
      from public.orders o join public.profiles pr on pr.id = o.customer_id
      where pr.phone ilike '%'||_q||'%' or o.id::text ilike _q||'%' or o.payment_ref ilike '%'||_q||'%'), '[]'::jsonb),
    'parcels', coalesce((select jsonb_agg(jsonb_build_object(
        'id', p.id, 'status', p.status, 'price', p.price, 'recipient_phone', p.recipient_phone,
        'tracking_token', p.tracking_token, 'created_at', p.created_at) order by p.created_at desc)
      from public.parcels p
      where p.recipient_phone ilike '%'||_q||'%' or p.id::text ilike _q||'%' or p.tracking_token ilike _q||'%'), '[]'::jsonb)
  ) into v;
  return v;
end;
$$;

-- ============================================================
-- Tickets : type, imputation, clôture avec motif (ops/support)
-- ============================================================
alter table public.tickets
  add column if not exists type          text,
  add column if not exists imputation    text,
  add column if not exists closed_reason text,
  add column if not exists closed_at     timestamptz;

create or replace function public.admin_create_ticket(_subject text, _type text, _priority text, _user_id uuid)
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare v_id uuid;
begin
  if not public.is_admin() then raise exception 'réservé à l''administration'; end if;
  insert into public.tickets (user_id, subject, type, priority, status)
  values (coalesce(_user_id, auth.uid()), _subject, _type, coalesce(_priority,'NORMALE'), 'OUVERT')
  returning id into v_id;
  insert into public.ticket_events (ticket_id, author_id, event_type, message)
  values (v_id, auth.uid(), 'CREATION', _subject);
  return v_id;
end;
$$;

create or replace function public.admin_close_ticket(_id uuid, _reason text, _imputation text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.is_admin() then raise exception 'réservé à l''administration'; end if;
  update public.tickets
     set status = 'CLOTURE', closed_reason = _reason, imputation = _imputation, closed_at = now()
   where id = _id;
  insert into public.ticket_events (ticket_id, author_id, event_type, message)
  values (_id, auth.uid(), 'CLOTURE', _reason);
  insert into public.admin_audit_logs (actor_id, action, entity_type, entity_id, payload)
  values (auth.uid(), 'admin_close_ticket', 'tickets', _id, jsonb_build_object('imputation', _imputation));
end;
$$;

-- Marquer une alerte comme traitée
create or replace function public.admin_resolve_alert(_id uuid)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.is_admin() then raise exception 'réservé à l''administration'; end if;
  update public.admin_alerts set status = 'TRAITEE', resolved_at = now() where id = _id;
end;
$$;

-- ============================================================
-- Verrouillage des exécutions
-- ============================================================
do $$
declare f text; internal text[] := array[ '_execute_approval(uuid)' ];
begin
  foreach f in array internal loop
    execute format('revoke all on function public.%s from public', f);
    execute format('grant execute on function public.%s to service_role', f);
  end loop;
end $$;

do $$
declare f text; admin_rpc text[] := array[
  'finance_request(text, integer, jsonb)', 'finance_approve(uuid)', 'finance_reject(uuid, text)',
  'admin_impose_job(uuid, uuid)', 'admin_offer_job(uuid, uuid)', 'admin_reassign_job(uuid, uuid)',
  'admin_cancel_job(uuid, text)', 'admin_update_zone(integer, jsonb)',
  'admin_dashboard_metrics()', 'admin_orders_by_hour(date)', 'admin_search(text)',
  'admin_resolve_alert(uuid)', 'admin_create_ticket(text, text, text, uuid)',
  'admin_close_ticket(uuid, text, text)', 'admin_live_map()',
  'admin_set_courier_status(uuid, courier_status)', 'admin_set_restaurant_status(uuid, restaurant_status)',
  'admin_set_restaurant_seller(uuid, uuid, numeric)' ];
begin
  foreach f in array admin_rpc loop
    execute format('revoke all on function public.%s from public', f);
    execute format('grant execute on function public.%s to authenticated, service_role', f);
  end loop;
end $$;

-- Realtime pour les demandes d'approbation (double validation live)
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin alter publication supabase_realtime add table public.approval_requests; exception when duplicate_object then null; end;
  end if;
end $$;
