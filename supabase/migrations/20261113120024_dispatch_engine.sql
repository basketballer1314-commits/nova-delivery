-- ============================================================
-- Nova Delivery — Migration 24 : Moteur de dispatch (SQL + pg_cron)
-- Réf. §10 du dossier. Tout côté serveur ; le client ne fait qu'accepter/refuser.
-- Statuts delivery_jobs utilisés : EN_ATTENTE_RECHERCHE, RECHERCHE, OFFRE,
--   ASSIGNE, RECUPERE, LIVRE, ANNULEE, ECHEC.
-- SMS = file dans public.notifications (type 'sms'), envoyée par un worker externe.
-- ============================================================
set search_path = public, extensions;

-- ---------- Paramètres de dispatch ----------
insert into settings (key, value) values
  ('dispatch_tick_seconds',        '30'),
  ('courier_speed_kmh',            '25'),
  ('dispatch_prep_buffer_min',     '5'),
  ('dispatch_default_eta_min',     '10'),
  ('dispatch_initial_radius_m',    '3000'),
  ('dispatch_widen_radius_m',      '8000'),
  ('dispatch_bonus_fcfa',          '200'),
  ('resto_reminder_min',           '2'),
  ('resto_support_min',            '3'),
  ('resto_cancel_min',             '8'),
  ('nocourier_widen_min',          '2'),
  ('nocourier_bonus_min',          '4'),
  ('nocourier_alert_min',          '6'),
  ('nocourier_client_min',         '10'),
  ('mobile_payment_expire_min',    '10'),
  ('courier_idle_alert_min',       '10'),
  ('courier_cancel_suspend_count', '3')
on conflict (key) do update set value = excluded.value;

-- ---------- Colonnes d'état de dispatch ----------
alter table public.delivery_jobs
  add column if not exists pickup_location  geography(Point, 4326),
  add column if not exists dropoff_location geography(Point, 4326),
  add column if not exists ready_at         timestamptz,
  add column if not exists search_started_at timestamptz,
  add column if not exists search_radius_m  integer,
  add column if not exists bonus            integer not null default 0 check (bonus >= 0),
  add column if not exists requires_cash    boolean not null default false,
  add column if not exists priority         boolean not null default false,
  add column if not exists customer_id      uuid references public.profiles(id) on delete set null,
  add column if not exists escalations      jsonb not null default '{}'::jsonb;

create index if not exists delivery_jobs_status_idx on public.delivery_jobs (status);
create index if not exists delivery_jobs_search_idx on public.delivery_jobs (search_started_at);
create index if not exists delivery_jobs_pickup_gist on public.delivery_jobs using gist (pickup_location);

alter table public.orders
  add column if not exists dispatch_flags jsonb not null default '{}'::jsonb;

-- ---------- Annulations livreur (compteur hebdomadaire) ----------
create table if not exists public.courier_cancellations (
  id         uuid primary key default gen_random_uuid(),
  courier_id uuid not null references public.courier_profiles(id) on delete cascade,
  job_id     uuid references public.delivery_jobs(id) on delete set null,
  justified  boolean not null default false,
  reason     text,
  created_at timestamptz not null default now()
);
create index if not exists courier_cancellations_courier_idx
  on public.courier_cancellations (courier_id, created_at);

-- ---------- Alertes back-office ----------
create table if not exists public.admin_alerts (
  id          uuid primary key default gen_random_uuid(),
  type        text not null,
  severity    text not null default 'warning' check (severity in ('info','warning','critical')),
  entity_type text,
  entity_id   uuid,
  order_id    uuid references public.orders(id) on delete set null,
  job_id      uuid references public.delivery_jobs(id) on delete set null,
  courier_id  uuid references public.courier_profiles(id) on delete set null,
  message     text not null,
  data        jsonb not null default '{}'::jsonb,
  status      text not null default 'OUVERTE' check (status in ('OUVERTE','TRAITEE')),
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists admin_alerts_status_idx on public.admin_alerts (status, created_at);
create index if not exists admin_alerts_type_idx on public.admin_alerts (type);

alter table public.admin_alerts          enable row level security;
alter table public.courier_cancellations enable row level security;

create policy admin_alerts_select on public.admin_alerts for select to authenticated
  using (public.is_admin());
create policy courier_cancellations_select on public.courier_cancellations for select to authenticated
  using (courier_id = auth.uid() or public.is_admin());

-- Realtime vers le back-office
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin alter publication supabase_realtime add table public.admin_alerts; exception when duplicate_object then null; end;
  end if;
end $$;

-- ============================================================
-- Helpers
-- ============================================================

create or replace function public.dispatch_setting(_key text, _default numeric)
returns numeric language sql stable security definer set search_path = public, extensions as $$
  select coalesce((select (value #>> '{}')::numeric from public.settings where key = _key), _default);
$$;

create or replace function public.courier_eta_minutes(_from geography, _to geography)
returns numeric language sql stable security definer set search_path = public, extensions as $$
  select case
    when _from is null or _to is null then null
    else (ST_Distance(_from, _to) / 1000.0)
         / nullif(public.dispatch_setting('courier_speed_kmh', 25), 0) * 60.0
  end;
$$;

create or replace function public.dispatch_queue_sms(_user_id uuid, _title text, _body text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if _user_id is null then return; end if;
  insert into public.notifications (user_id, type, title, body)
  values (_user_id, 'sms', _title, _body);
end;
$$;

create or replace function public.record_admin_alert(
  _type text, _severity text, _message text,
  _order uuid, _job uuid, _courier uuid, _data jsonb
) returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare v_id uuid;
begin
  insert into public.admin_alerts (type, severity, message, order_id, job_id, courier_id, data,
                                   entity_type, entity_id)
  values (_type, _severity, _message, _order, _job, _courier, coalesce(_data, '{}'::jsonb),
          case when _order is not null then 'orders'
               when _job is not null then 'delivery_jobs'
               when _courier is not null then 'courier_profiles' end,
          coalesce(_order, _job, _courier))
  returning id into v_id;
  return v_id;
end;
$$;

-- ============================================================
-- Choix du livreur (§10.2)
-- ============================================================
create or replace function public.dispatch_eligible_couriers(_job_id uuid)
returns table (courier_id uuid, distance_m double precision, eta_min numeric, deliveries_today integer)
language sql stable security definer set search_path = public, extensions as $$
  with j as (select * from public.delivery_jobs where id = _job_id)
  select
    c.id,
    ST_Distance(c.last_location, j.pickup_location) as distance_m,
    public.courier_eta_minutes(c.last_location, j.pickup_location) as eta_min,
    (select count(*)::int from public.delivery_jobs dj
       where dj.courier_id = c.id and dj.assigned_at::date = current_date
         and dj.status not in ('ANNULEE','ECHEC')) as deliveries_today
  from public.courier_profiles c, j
  where c.availability <> 'HORS_LIGNE'
    and not (j.requires_cash and c.availability = 'BLOQUE_CAISSE')   -- pas BLOQUE_CAISSE si espèces
    and c.id is distinct from j.customer_id                          -- RG-02
    and c.last_location is not null
    and j.pickup_location is not null
    and ST_DWithin(c.last_location, j.pickup_location, coalesce(j.search_radius_m, 3000))
    and not exists (select 1 from public.job_offers o                -- une offre à la fois par livreur
                      where o.courier_id = c.id and o.response = 'PENDING' and o.expires_at > now())
    and case
      when j.job_type = 'food' then
        (select count(*) from public.delivery_jobs a
           where a.courier_id = c.id and a.status in ('ASSIGNE','RECUPERE')) = 0   -- un seul repas, exclusif
      else
        (select count(*) from public.delivery_jobs a
           where a.courier_id = c.id and a.job_type = 'food' and a.status in ('ASSIGNE','RECUPERE')) = 0
        and (select count(*) from public.delivery_jobs a
           where a.courier_id = c.id and a.job_type = 'parcel' and a.status in ('ASSIGNE','RECUPERE')) < 2  -- 2 colis max
    end
  order by distance_m asc, deliveries_today asc;
$$;

-- ============================================================
-- Faire une offre (une à la fois, 45 s)
-- ============================================================
create or replace function public.dispatch_make_offer(_job_id uuid)
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare v_cand uuid; v_timeout integer;
begin
  -- offre déjà en cours ?
  if exists (select 1 from public.job_offers o
               where o.job_id = _job_id and o.response = 'PENDING' and o.expires_at > now()) then
    return null;
  end if;

  select ec.courier_id into v_cand
  from public.dispatch_eligible_couriers(_job_id) ec
  where ec.courier_id not in (
    select o.courier_id from public.job_offers o
    where o.job_id = _job_id and o.response in ('DECLINED','EXPIRED')  -- pas de re-proposition pour CE job
  )
  limit 1;

  if v_cand is null then return null; end if;

  v_timeout := public.dispatch_setting('offer_timeout_seconds', 45)::int;
  insert into public.job_offers (job_id, courier_id, expires_at)
  values (_job_id, v_cand, now() + make_interval(secs => v_timeout));

  update public.delivery_jobs set status = 'OFFRE' where id = _job_id;

  perform public.dispatch_queue_sms(v_cand, 'Nouvelle course',
    'Une course vous est proposée. Vous avez ' || v_timeout || ' s pour accepter.');
  insert into public.notifications (user_id, type, title, body, data)
  values (v_cand, 'job_offer', 'Nouvelle course', 'Course proposée',
          jsonb_build_object('job_id', _job_id));
  return v_cand;
end;
$$;

-- ============================================================
-- Démarrage de la recherche (§10.1)
-- ============================================================
create or replace function public.start_courier_search(_job_id uuid)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
declare
  j record;
  v_prep_remaining numeric;
  v_nearest numeric;
  v_buffer numeric;
  v_default_eta numeric;
begin
  select * into j from public.delivery_jobs where id = _job_id;
  if j is null or j.search_started_at is not null then return false; end if;

  -- Colis : la recherche démarre immédiatement (pas de préparation).
  if j.job_type = 'parcel' then
    update public.delivery_jobs
       set search_started_at = now(), status = 'RECHERCHE',
           search_radius_m = coalesce(search_radius_m, public.dispatch_setting('dispatch_initial_radius_m',3000)::int)
     where id = _job_id;
    perform public.dispatch_make_offer(_job_id);
    return true;
  end if;

  -- Repas : démarrer quand prép. restante ≤ ETA du plus proche + buffer.
  v_buffer      := public.dispatch_setting('dispatch_prep_buffer_min', 5);
  v_default_eta := public.dispatch_setting('dispatch_default_eta_min', 10);
  v_prep_remaining := extract(epoch from (coalesce(j.ready_at, now()) - now())) / 60.0;
  select min(ec.eta_min) into v_nearest from public.dispatch_eligible_couriers(_job_id) ec;

  if v_prep_remaining <= coalesce(v_nearest, v_default_eta) + v_buffer then
    update public.delivery_jobs set search_started_at = now(), status = 'RECHERCHE' where id = _job_id;
    perform public.dispatch_make_offer(_job_id);
    return true;
  end if;
  return false;
end;
$$;

-- ============================================================
-- RPC livreur : accepter / refuser une offre, annuler une mission
-- ============================================================
create or replace function public.courier_accept_offer(_offer_id uuid)
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare o record; j record; v_payout integer;
begin
  select * into o from public.job_offers where id = _offer_id for update;
  if o is null or o.courier_id <> auth.uid() then raise exception 'offre introuvable'; end if;
  if o.response <> 'PENDING' or o.expires_at <= now() then raise exception 'offre expirée'; end if;

  update public.job_offers set response = 'ACCEPTED', responded_at = now() where id = _offer_id;

  select * into j from public.delivery_jobs where id = o.job_id for update;
  if j.courier_id is not null then raise exception 'course déjà attribuée'; end if;

  if j.job_type = 'food' then
    select coalesce((pricing_snapshot->>'courierShare')::int, 0) into v_payout from public.orders where id = j.order_id;
  else
    select coalesce((pricing_snapshot->>'courierShare')::int, 0) into v_payout from public.parcels where id = j.parcel_id;
  end if;

  update public.delivery_jobs
     set courier_id = o.courier_id, assigned_at = now(), status = 'ASSIGNE',
         payout = coalesce(v_payout, 0) + coalesce(j.bonus, 0), priority = false
   where id = j.id;

  update public.courier_profiles set availability = 'EN_MISSION' where id = o.courier_id;

  if j.order_id is not null then
    update public.orders  set status = 'LIVREUR_ASSIGNE' where id = j.order_id;
  else
    update public.parcels set status = 'LIVREUR_ASSIGNE' where id = j.parcel_id;
  end if;

  return j.id;
end;
$$;

create or replace function public.courier_decline_offer(_offer_id uuid)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare o record;
begin
  select * into o from public.job_offers where id = _offer_id for update;
  if o is null or o.courier_id <> auth.uid() then raise exception 'offre introuvable'; end if;
  if o.response <> 'PENDING' then raise exception 'offre déjà traitée'; end if;

  update public.job_offers set response = 'DECLINED', responded_at = now() where id = _offer_id;
  update public.delivery_jobs set status = 'RECHERCHE' where id = o.job_id;
  perform public.dispatch_make_offer(o.job_id);  -- livreur suivant immédiatement
end;
$$;

create or replace function public.courier_cancel_job(_job_id uuid, _reason text)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare j record; v_week_cancels integer; v_limit integer;
begin
  select * into j from public.delivery_jobs where id = _job_id for update;
  if j is null or j.courier_id <> auth.uid() then raise exception 'mission introuvable'; end if;
  if j.status not in ('ASSIGNE','RECUPERE') then raise exception 'mission non annulable'; end if;

  insert into public.courier_cancellations (courier_id, job_id, justified, reason)
  values (j.courier_id, _job_id, false, _reason);

  -- Remise en recherche prioritaire
  update public.delivery_jobs
     set courier_id = null, assigned_at = null, status = 'RECHERCHE', priority = true
   where id = _job_id;

  -- Libère le livreur s'il n'a plus de mission active
  update public.courier_profiles c set availability = 'EN_LIGNE_LIBRE'
   where c.id = j.courier_id
     and not exists (select 1 from public.delivery_jobs a
                       where a.courier_id = c.id and a.status in ('ASSIGNE','RECUPERE'));

  if j.order_id is not null then
    update public.orders set status = 'RECHERCHE_LIVREUR' where id = j.order_id;
  else
    update public.parcels set status = 'RECHERCHE_LIVREUR' where id = j.parcel_id;
  end if;

  -- Suspension après N annulations injustifiées / 7 jours
  v_limit := public.dispatch_setting('courier_cancel_suspend_count', 3)::int;
  select count(*) into v_week_cancels from public.courier_cancellations
   where courier_id = j.courier_id and justified = false and created_at >= now() - interval '7 days';
  if v_week_cancels >= v_limit then
    update public.courier_profiles set status = 'SUSPENDU', availability = 'HORS_LIGNE' where id = j.courier_id;
    perform public.record_admin_alert('COURIER_SUSPENDU', 'critical',
      'Livreur suspendu : ' || v_week_cancels || ' annulations injustifiées cette semaine.',
      null, _job_id, j.courier_id, jsonb_build_object('week_cancels', v_week_cancels));
  else
    perform public.record_admin_alert('COURIER_CANCEL', 'warning',
      'Annulation après acceptation : course remise en recherche prioritaire.',
      j.order_id, _job_id, j.courier_id, jsonb_build_object('reason', _reason));
  end if;

  perform public.dispatch_make_offer(_job_id);
end;
$$;

-- ============================================================
-- Création du job quand la commande est acceptée
-- ============================================================
create or replace function public.on_order_accepted()
returns trigger language plpgsql security definer set search_path = public, extensions as $$
begin
  if new.status = 'ACCEPTEE' and old.status is distinct from new.status and new.restaurant_id is not null then
    if not exists (select 1 from public.delivery_jobs where order_id = new.id) then
      insert into public.delivery_jobs (job_type, order_id, status, pickup_location, dropoff_location,
                                        ready_at, search_radius_m, requires_cash, customer_id, payout)
      select 'food', new.id, 'EN_ATTENTE_RECHERCHE', r.location, a.location,
             now() + make_interval(mins => coalesce(new.prep_minutes, 25)),
             public.dispatch_setting('dispatch_initial_radius_m', 3000)::int,
             (new.payment_method = 'cash'), new.customer_id,
             coalesce((new.pricing_snapshot->>'courierShare')::int, 0)
      from public.restaurants r
      left join public.addresses a on a.id = new.delivery_address_id
      where r.id = new.restaurant_id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists order_accepted_dispatch on public.orders;
create trigger order_accepted_dispatch
  after update of status on public.orders
  for each row execute function public.on_order_accepted();

-- Job colis quand le colis est confirmé
create or replace function public.on_parcel_confirmed()
returns trigger language plpgsql security definer set search_path = public, extensions as $$
begin
  if new.status = 'CONFIRMEE' and old.status is distinct from new.status then
    if not exists (select 1 from public.delivery_jobs where parcel_id = new.id) then
      insert into public.delivery_jobs (job_type, parcel_id, status, pickup_location, dropoff_location,
                                        search_radius_m, requires_cash, customer_id, payout)
      select 'parcel', new.id, 'EN_ATTENTE_RECHERCHE', pu.location, dr.location,
             public.dispatch_setting('dispatch_initial_radius_m', 3000)::int,
             (new.payment_method = 'cash'), new.sender_id,
             coalesce((new.pricing_snapshot->>'courierShare')::int, 0)
      from public.addresses pu
      left join public.addresses dr on dr.id = new.dropoff_address_id
      where pu.id = new.pickup_address_id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists parcel_confirmed_dispatch on public.parcels;
create trigger parcel_confirmed_dispatch
  after update of status on public.parcels
  for each row execute function public.on_parcel_confirmed();

-- ============================================================
-- Boucle de dispatch (pg_cron)
-- ============================================================
create or replace function public.dispatch_tick()
returns void language plpgsql security definer set search_path = public, extensions as $$
declare
  r record;
  v_elapsed numeric;
  v_esc jsonb;
  v_radius integer;
  v_bonus integer;
begin
  -- A. Expiration des offres non répondues
  update public.job_offers set response = 'EXPIRED', responded_at = now()
   where response = 'PENDING' and expires_at <= now();

  -- B. Démarrage des recherches (repas prêts bientôt, colis confirmés)
  for r in
    select dj.id from public.delivery_jobs dj
    where dj.search_started_at is null and dj.status = 'EN_ATTENTE_RECHERCHE'
  loop
    perform public.start_courier_search(r.id);
  end loop;

  -- Relance d'offre pour les jobs en recherche sans offre active
  for r in
    select id from public.delivery_jobs
    where status in ('RECHERCHE','OFFRE') and search_started_at is not null
  loop
    perform public.dispatch_make_offer(r.id);
  end loop;

  -- C. Escalades « aucun livreur » (§10.3)
  for r in
    select * from public.delivery_jobs
    where status in ('RECHERCHE','OFFRE') and search_started_at is not null
  loop
    v_elapsed := extract(epoch from (now() - r.search_started_at)) / 60.0;
    v_esc := r.escalations;
    v_radius := r.search_radius_m;
    v_bonus := r.bonus;

    if v_elapsed >= public.dispatch_setting('nocourier_widen_min', 2) and not (v_esc ? 'widen') then
      v_radius := public.dispatch_setting('dispatch_widen_radius_m', 8000)::int;
      v_esc := v_esc || jsonb_build_object('widen', now());
    end if;
    if v_elapsed >= public.dispatch_setting('nocourier_bonus_min', 4) and not (v_esc ? 'bonus') then
      v_bonus := v_bonus + public.dispatch_setting('dispatch_bonus_fcfa', 200)::int;
      v_esc := v_esc || jsonb_build_object('bonus', now());
    end if;
    if v_elapsed >= public.dispatch_setting('nocourier_alert_min', 6) and not (v_esc ? 'alert') then
      perform public.record_admin_alert('NO_COURIER', 'critical',
        'Aucun livreur trouvé depuis ' || round(v_elapsed) || ' min.',
        r.order_id, r.id, null, '{}'::jsonb);
      v_esc := v_esc || jsonb_build_object('alert', now());
    end if;
    if v_elapsed >= public.dispatch_setting('nocourier_client_min', 10) and not (v_esc ? 'client') then
      if r.customer_id is not null then
        perform public.dispatch_queue_sms(r.customer_id, 'Recherche en cours',
          'Nous cherchons encore un livreur pour votre commande. Merci de patienter.');
      end if;
      v_esc := v_esc || jsonb_build_object('client', now());
    end if;

    if v_esc is distinct from r.escalations or v_radius is distinct from r.search_radius_m or v_bonus is distinct from r.bonus then
      update public.delivery_jobs set escalations = v_esc, search_radius_m = v_radius, bonus = v_bonus where id = r.id;
      if v_radius is distinct from r.search_radius_m then
        perform public.dispatch_make_offer(r.id);  -- réessaie avec le rayon élargi
      end if;
    end if;
  end loop;

  -- D. Restaurant sans réponse (§10.3)
  for r in
    select * from public.orders where status = 'ENVOYEE_RESTAURANT'
  loop
    v_elapsed := extract(epoch from (now() - r.created_at)) / 60.0;
    v_esc := r.dispatch_flags;

    if v_elapsed >= public.dispatch_setting('resto_reminder_min', 2) and not (v_esc ? 'resto_reminder') then
      perform public.dispatch_queue_sms(
        (select owner_id from public.restaurants where id = r.restaurant_id),
        'Commande en attente', 'Vous avez une commande à accepter ou refuser.');
      v_esc := v_esc || jsonb_build_object('resto_reminder', now());
    end if;
    if v_elapsed >= public.dispatch_setting('resto_support_min', 3) and not (v_esc ? 'resto_support') then
      perform public.record_admin_alert('RESTO_NO_RESPONSE', 'warning',
        'Restaurant sans réponse depuis ' || round(v_elapsed) || ' min.',
        r.id, null, null, jsonb_build_object('restaurant_id', r.restaurant_id));
      v_esc := v_esc || jsonb_build_object('resto_support', now());
    end if;
    if v_elapsed >= public.dispatch_setting('resto_cancel_min', 8) and not (v_esc ? 'resto_cancel') then
      update public.orders set status = 'ANNULEE', dispatch_flags = v_esc || jsonb_build_object('resto_cancel', now())
       where id = r.id;
      -- Remboursement si un paiement existe (traité par la finance, J+1)
      insert into public.refunds (payment_id, order_id, amount, reason, status)
      select p.id, r.id, p.amount, 'restaurant sans réponse', 'EN_ATTENTE'
      from public.payments p where p.order_id = r.id;
      insert into public.admin_audit_logs (action, entity_type, entity_id, payload)
      values ('order_auto_cancel_resto_no_response', 'orders', r.id, jsonb_build_object('elapsed_min', round(v_elapsed)));
      perform public.record_admin_alert('ORDER_CANCELLED', 'critical',
        'Commande annulée (restaurant sans réponse 8 min).', r.id, null, null, '{}'::jsonb);
      if r.customer_id is not null then
        perform public.dispatch_queue_sms(r.customer_id, 'Commande annulée',
          'Votre commande a été annulée car le restaurant n''a pas répondu. Vous serez remboursé.');
      end if;
      continue;  -- déjà mis à jour
    end if;

    if v_esc is distinct from r.dispatch_flags then
      update public.orders set dispatch_flags = v_esc where id = r.id;
    end if;
  end loop;

  -- E. Paiement mobile en attente > 10 min → expiration
  for r in
    select * from public.orders
    where status = 'EN_ATTENTE_PAIEMENT' and payment_method in ('wave','orange_money')
      and created_at < now() - make_interval(mins => public.dispatch_setting('mobile_payment_expire_min', 10)::int)
  loop
    update public.orders set status = 'ANNULEE' where id = r.id;
    perform public.record_admin_alert('PAYMENT_EXPIRED', 'info',
      'Paiement mobile expiré après 10 min, commande annulée.', r.id, null, null, '{}'::jsonb);
    if r.customer_id is not null then
      perform public.dispatch_queue_sms(r.customer_id, 'Paiement expiré',
        'Le délai de paiement est dépassé. Votre commande a été annulée.');
    end if;
  end loop;

  -- F. Livreur immobile 10 min en mission → alerte
  for r in
    select dj.*, c.last_seen_at from public.delivery_jobs dj
    join public.courier_profiles c on c.id = dj.courier_id
    where dj.status in ('ASSIGNE','RECUPERE')
  loop
    if r.last_seen_at is not null
       and r.last_seen_at < now() - make_interval(mins => public.dispatch_setting('courier_idle_alert_min', 10)::int)
       and not (r.escalations ? 'idle') then
      perform public.record_admin_alert('COURIER_IDLE', 'warning',
        'Livreur immobile depuis plus de 10 min en mission.', r.order_id, r.id, r.courier_id, '{}'::jsonb);
      update public.delivery_jobs set escalations = r.escalations || jsonb_build_object('idle', now()) where id = r.id;
    end if;
  end loop;
end;
$$;

-- ============================================================
-- Planification pg_cron : 30 s si supporté, sinon chaque minute
-- ============================================================
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    if exists (select 1 from cron.job where jobname = 'nova_dispatch_tick') then
      perform cron.unschedule('nova_dispatch_tick');
    end if;
    begin
      perform cron.schedule('nova_dispatch_tick', '30 seconds', 'select public.dispatch_tick();');
    exception when others then
      perform cron.schedule('nova_dispatch_tick', '* * * * *', 'select public.dispatch_tick();');
    end;
  end if;
end $$;
