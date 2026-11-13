-- ============================================================
-- Nova Delivery — Migration 26 : Argent (paiement manuel + grand livre)
-- Réf. §8 et §11.2 du dossier. Tout en entiers FCFA, partie double.
-- Mode « paiement manuel » d'abord (Wave / OM validés par un admin finance).
-- post_ledger(kind, idempotency, payload) : écritures équilibrées (trigger).
-- ============================================================
set search_path = public, extensions;

-- ---------- Paramètres : numéros marchands ----------
insert into settings (key, value) values
  ('wave_merchant_number', '"+221770000000"'),
  ('om_merchant_number',   '"+221780000000"')
on conflict (key) do update set value = excluded.value;

-- ---------- Colonnes additionnelles ----------
alter table public.orders
  add column if not exists payment_ref text;

alter table public.refunds
  add column if not exists imputation text
    check (imputation in ('platform','restaurant','courier'));

alter table public.restaurants
  add column if not exists seller_id uuid references public.profiles(id) on delete set null,
  add column if not exists seller_commission_pct numeric(5,2) not null default 0
    check (seller_commission_pct >= 0 and seller_commission_pct <= 100);

-- Référence courte « A-#### » pour le motif de paiement manuel
create sequence if not exists public.payment_ref_seq;

create or replace function public.gen_payment_ref()
returns text language sql volatile set search_path = public as $$
  select 'A-' || lpad((nextval('public.payment_ref_seq') % 10000)::text, 4, '0');
$$;

create or replace function public.set_payment_ref()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.payment_method in ('wave','orange_money') and new.payment_ref is null then
    new.payment_ref := public.gen_payment_ref();
  end if;
  return new;
end;
$$;

drop trigger if exists orders_payment_ref on public.orders;
create trigger orders_payment_ref before insert on public.orders
  for each row execute function public.set_payment_ref();

-- ---------- Idempotence des transactions comptables ----------
create table if not exists public.ledger_transactions (
  id              uuid primary key default gen_random_uuid(),
  kind            text not null,
  idempotency_key text not null unique,
  reference       text,
  created_at      timestamptz not null default now()
);
alter table public.ledger_transactions enable row level security;
create policy ledger_tx_select on public.ledger_transactions for select to authenticated
  using (public.is_finance_admin());

-- ---------- Alertes back-office (mutualisé avec le moteur de dispatch) ----------
create table if not exists public.admin_alerts (
  id          uuid primary key default gen_random_uuid(),
  type        text not null,
  severity    text not null default 'warning' check (severity in ('info','warning','critical')),
  entity_type text,
  entity_id   uuid,
  order_id    uuid references public.orders(id) on delete set null,
  job_id      uuid,
  courier_id  uuid references public.courier_profiles(id) on delete set null,
  message     text not null,
  data        jsonb not null default '{}'::jsonb,
  status      text not null default 'OUVERTE' check (status in ('OUVERTE','TRAITEE')),
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);
do $$
begin
  if not exists (select 1 from pg_policies where tablename='admin_alerts' and policyname='admin_alerts_select') then
    execute 'alter table public.admin_alerts enable row level security';
    execute 'create policy admin_alerts_select on public.admin_alerts for select to authenticated using (public.is_admin())';
  end if;
end $$;

create or replace function public.record_admin_alert(
  _type text, _severity text, _message text,
  _order uuid, _job uuid, _courier uuid, _data jsonb
) returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare v_id uuid;
begin
  insert into public.admin_alerts (type, severity, message, order_id, job_id, courier_id, data, entity_type, entity_id)
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
-- Grand livre : post_ledger (partie double)
-- ============================================================
create or replace function public._lline(_acct text, _acct_id uuid, _debit integer, _credit integer)
returns jsonb language sql immutable as $$
  select jsonb_build_object('acct', _acct, 'acct_id', _acct_id, 'd', coalesce(_debit,0), 'c', coalesce(_credit,0));
$$;

create or replace function public.post_ledger(_kind text, _idempotency text, _payload jsonb)
returns uuid
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_tx uuid;
  v_lines jsonb := '[]'::jsonb;
  v_line jsonb;
  o record; p record;
  v_amount integer; v_I integer; v_D integer; v_S integer; v_disc integer; v_total integer;
  v_C integer; v_CS integer; v_RP integer; v_margin integer;
  v_base integer; v_heavy integer; v_codfee integer; v_X integer;
  v_sc integer; v_seller uuid; v_pct numeric;
  v_imp text; v_acct text; v_acct_id uuid; v_courier uuid;
begin
  -- Idempotence : une transaction par clé.
  insert into public.ledger_transactions (kind, idempotency_key, reference)
  values (_kind, _idempotency, _payload->>'reference')
  on conflict (idempotency_key) do nothing
  returning id into v_tx;
  if v_tx is null then
    return (select id from public.ledger_transactions where idempotency_key = _idempotency);
  end if;

  if _kind = 'order_completed' then
    select ord.*, r.seller_id as rseller, r.seller_commission_pct as rpct, r.commission_rate as rcomm
      into o from public.orders ord join public.restaurants r on r.id = ord.restaurant_id
     where ord.id = (_payload->>'order_id')::uuid;
    v_I := o.items_total; v_D := o.delivery_fee; v_S := o.service_fee; v_disc := o.discount_total; v_total := o.total;
    v_C := coalesce((o.pricing_snapshot->>'commission')::int, round(v_I * o.rcomm / 100.0)::int);
    v_CS := coalesce((o.pricing_snapshot->>'courierShare')::int, round(v_D * 0.8)::int);
    v_RP := v_I - v_C;
    v_margin := v_D - v_CS;
    select courier_id into v_courier from public.delivery_jobs
      where order_id = o.id and job_type = 'food' order by assigned_at desc nulls last limit 1;
    v_lines := v_lines
      || public._lline('client_settlement', null, v_total, 0)
      || public._lline('promo_expense', null, v_disc, 0)
      || public._lline('resto_payable', o.restaurant_id, 0, v_RP)
      || public._lline('courier_payable', v_courier, 0, v_CS)
      || public._lline('platform_commission', null, 0, v_C)
      || public._lline('platform_service_fee', null, 0, v_S)
      || public._lline('platform_delivery_margin', null, 0, v_margin);
    -- Commission vendeur (agent lié au restaurant)
    if o.rseller is not null and coalesce(o.rpct,0) > 0 then
      v_sc := round(v_C * o.rpct / 100.0)::int;
      if v_sc > 0 then
        v_lines := v_lines
          || public._lline('seller_expense', null, v_sc, 0)
          || public._lline('seller_payable', o.rseller, 0, v_sc);
      end if;
    end if;

  elsif _kind = 'parcel_completed' then
    select * into p from public.parcels where id = (_payload->>'parcel_id')::uuid;
    v_base := coalesce((p.pricing_snapshot->>'baseFee')::int, p.price);
    v_heavy := coalesce((p.pricing_snapshot->>'heavy')::int, 0);
    v_codfee := coalesce((p.pricing_snapshot->>'codFee')::int, 0);
    v_X := v_base + v_heavy;
    v_CS := coalesce((p.pricing_snapshot->>'courierShare')::int, round(v_X * 0.8)::int);
    v_margin := v_X - v_CS;
    select courier_id into v_courier from public.delivery_jobs
      where parcel_id = p.id and job_type = 'parcel' order by assigned_at desc nulls last limit 1;
    v_lines := v_lines
      || public._lline('client_settlement', null, v_X + v_codfee, 0)
      || public._lline('courier_payable', v_courier, 0, v_CS)
      || public._lline('platform_delivery_margin', null, 0, v_margin)
      || public._lline('platform_cod_fee', null, 0, v_codfee);

  elsif _kind = 'mobile_capture' then
    v_amount := (_payload->>'amount')::int;
    v_lines := v_lines
      || public._lline('platform_cash', null, v_amount, 0)
      || public._lline('client_settlement', null, 0, v_amount);

  elsif _kind = 'cash_collected' then
    v_amount := (_payload->>'amount')::int;
    v_acct_id := (_payload->>'courier_id')::uuid;
    v_lines := v_lines
      || public._lline('courier_cash', v_acct_id, v_amount, 0)
      || public._lline('client_settlement', null, 0, v_amount);

  elsif _kind = 'cod_collected' then
    v_amount := (_payload->>'amount')::int;
    v_lines := v_lines
      || public._lline('courier_cash', (_payload->>'courier_id')::uuid, v_amount, 0)
      || public._lline('cod_payable', (_payload->>'sender_id')::uuid, 0, v_amount);

  elsif _kind = 'cash_remittance' then
    v_amount := (_payload->>'amount')::int;
    v_lines := v_lines
      || public._lline('platform_cash', null, v_amount, 0)
      || public._lline('courier_cash', (_payload->>'courier_id')::uuid, 0, v_amount);

  elsif _kind = 'cod_remittance' then
    v_amount := (_payload->>'amount')::int;
    v_lines := v_lines
      || public._lline('cod_payable', (_payload->>'sender_id')::uuid, v_amount, 0)
      || public._lline('platform_cash', null, 0, v_amount);

  elsif _kind = 'resto_payout' then
    v_amount := (_payload->>'amount')::int;
    v_lines := v_lines
      || public._lline('resto_payable', (_payload->>'restaurant_id')::uuid, v_amount, 0)
      || public._lline('platform_cash', null, 0, v_amount);

  elsif _kind = 'courier_payout' then
    v_amount := (_payload->>'amount')::int;
    v_lines := v_lines
      || public._lline('courier_payable', (_payload->>'courier_id')::uuid, v_amount, 0)
      || public._lline('platform_cash', null, 0, v_amount);

  elsif _kind = 'seller_payout' then
    v_amount := (_payload->>'amount')::int;
    v_lines := v_lines
      || public._lline('seller_payable', (_payload->>'seller_id')::uuid, v_amount, 0)
      || public._lline('platform_cash', null, 0, v_amount);

  elsif _kind = 'refund' then
    v_amount := (_payload->>'amount')::int;
    v_imp := coalesce(_payload->>'imputation', 'platform');
    if v_imp = 'restaurant' then v_acct := 'resto_payable';
    elsif v_imp = 'courier' then v_acct := 'courier_payable';
    else v_acct := 'refund_expense'; end if;
    v_acct_id := nullif(_payload->>'account_id','')::uuid;
    v_lines := v_lines
      || public._lline(v_acct, v_acct_id, v_amount, 0)
      || public._lline('platform_cash', null, 0, v_amount);

  else
    raise exception 'post_ledger : type inconnu %', _kind;
  end if;

  -- Écriture des lignes
  for v_line in select * from jsonb_array_elements(v_lines) loop
    insert into public.ledger_entries (transaction_id, account_type, account_id, debit, credit, reference)
    values (v_tx, v_line->>'acct', nullif(v_line->>'acct_id','null')::uuid,
            (v_line->>'d')::int, (v_line->>'c')::int, _kind);
  end loop;

  return v_tx;
end;
$$;

-- ============================================================
-- Déclencheur : commande / colis terminé → écriture comptable
-- ============================================================
create or replace function public.on_entity_completed()
returns trigger language plpgsql security definer set search_path = public, extensions as $$
begin
  if tg_table_name = 'orders' and new.status = 'TERMINEE' and old.status is distinct from new.status then
    perform public.post_ledger('order_completed', 'order_completed:' || new.id, jsonb_build_object('order_id', new.id));
  elsif tg_table_name = 'parcels' and new.status = 'TERMINE' and old.status is distinct from new.status then
    perform public.post_ledger('parcel_completed', 'parcel_completed:' || new.id, jsonb_build_object('parcel_id', new.id));
  end if;
  return new;
end;
$$;

drop trigger if exists order_completed_ledger on public.orders;
create trigger order_completed_ledger after update of status on public.orders
  for each row execute function public.on_entity_completed();

drop trigger if exists parcel_completed_ledger on public.parcels;
create trigger parcel_completed_ledger after update of status on public.parcels
  for each row execute function public.on_entity_completed();

-- ============================================================
-- Paiement manuel : instructions client + validation finance
-- ============================================================
create or replace function public.payment_instructions(_order_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare o record; v_number text;
begin
  select * into o from public.orders where id = _order_id;
  if o is null then raise exception 'commande introuvable'; end if;
  if o.customer_id <> auth.uid() and not public.is_finance_admin() then raise exception 'non autorisé'; end if;
  if o.payment_method not in ('wave','orange_money') then raise exception 'paiement non manuel'; end if;
  select (value #>> '{}') into v_number from public.settings
    where key = case when o.payment_method = 'wave' then 'wave_merchant_number' else 'om_merchant_number' end;
  return jsonb_build_object(
    'method', o.payment_method, 'merchant_number', v_number,
    'amount', o.total, 'reference', o.payment_ref,
    'status', o.status, 'expires_in_min', 10);
end;
$$;

create or replace function public.finance_validate_payment(_order_id uuid)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare o record;
begin
  if not public.is_finance_admin() then raise exception 'réservé à la finance'; end if;
  select * into o from public.orders where id = _order_id for update;
  if o is null then raise exception 'commande introuvable'; end if;
  if o.status <> 'EN_ATTENTE_PAIEMENT' then raise exception 'statut invalide'; end if;
  if o.payment_method not in ('wave','orange_money') then raise exception 'paiement non manuel'; end if;

  insert into public.payments (order_id, method, amount, status, idempotency_key, provider_ref)
  values (_order_id, o.payment_method, o.total, 'PAYE', 'manual:' || _order_id, o.payment_ref)
  on conflict (idempotency_key) do update set status = 'PAYE';

  update public.orders set status = 'ENVOYEE_RESTAURANT' where id = _order_id;

  perform public.post_ledger('mobile_capture', 'capture:' || _order_id,
    jsonb_build_object('order_id', _order_id, 'amount', o.total, 'reference', o.payment_ref));

  insert into public.admin_audit_logs (actor_id, action, entity_type, entity_id, payload)
  values (auth.uid(), 'finance_validate_payment', 'orders', _order_id, jsonb_build_object('amount', o.total));
end;
$$;

-- Passerelle finance générique vers post_ledger (encaissement espèces, versements, remb.)
create or replace function public.finance_post(_kind text, _idempotency text, _payload jsonb)
returns uuid language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.is_finance_admin() then raise exception 'réservé à la finance'; end if;
  return public.post_ledger(_kind, _idempotency, _payload);
end;
$$;

-- ============================================================
-- Vues de solde (security_invoker → la RLS ledger s'applique)
-- ============================================================
create or replace view public.v_restaurant_balances
  with (security_invoker = true) as
  select account_id as restaurant_id, sum(credit - debit)::bigint as balance_due
  from public.ledger_entries where account_type = 'resto_payable'
  group by account_id;

create or replace view public.v_courier_balances
  with (security_invoker = true) as
  select c.id as courier_id,
    coalesce((select sum(credit - debit) from public.ledger_entries l
              where l.account_type = 'courier_payable' and l.account_id = c.id), 0)::bigint as earnings_due,
    coalesce((select sum(debit - credit) from public.ledger_entries l
              where l.account_type = 'courier_cash' and l.account_id = c.id), 0)::bigint as cash_held
  from public.courier_profiles c;

create or replace view public.v_seller_balances
  with (security_invoker = true) as
  select account_id as seller_id, sum(credit - debit)::bigint as balance_due
  from public.ledger_entries where account_type = 'seller_payable'
  group by account_id;

grant select on public.v_restaurant_balances, public.v_courier_balances, public.v_seller_balances to authenticated;

-- ============================================================
-- Règlements automatiques (idempotents) : CR J+1, restaurants hebdo
-- ============================================================
create or replace function public.settle_cod_j1()
returns void language plpgsql security definer set search_path = public, extensions as $$
declare s record;
begin
  for s in
    select account_id as sid, sum(credit - debit) as bal
    from public.ledger_entries where account_type = 'cod_payable'
    group by account_id having sum(credit - debit) > 0
  loop
    perform public.post_ledger('cod_remittance',
      'cod_j1:' || s.sid || ':' || to_char(current_date, 'YYYY-MM-DD'),
      jsonb_build_object('sender_id', s.sid, 'amount', s.bal));
  end loop;
end;
$$;

create or replace function public.settle_restaurants_weekly()
returns void language plpgsql security definer set search_path = public, extensions as $$
declare r record;
begin
  for r in
    select account_id as rid, sum(credit - debit) as bal
    from public.ledger_entries where account_type = 'resto_payable'
    group by account_id having sum(credit - debit) > 0
  loop
    perform public.post_ledger('resto_payout',
      'resto_weekly:' || r.rid || ':' || to_char(current_date, 'IYYY-IW'),
      jsonb_build_object('restaurant_id', r.rid, 'amount', r.bal));
  end loop;
end;
$$;

-- ============================================================
-- Réconciliation quotidienne : signale tout écart
-- ============================================================
create or replace function public.ledger_reconcile()
returns void language plpgsql security definer set search_path = public, extensions as $$
declare gd bigint; gc bigint; t record; o record;
begin
  select coalesce(sum(debit),0), coalesce(sum(credit),0) into gd, gc from public.ledger_entries;
  if gd <> gc then
    perform public.record_admin_alert('LEDGER_IMBALANCE', 'critical',
      'Grand livre global déséquilibré : débit=' || gd || ' crédit=' || gc, null, null, null,
      jsonb_build_object('debit', gd, 'credit', gc));
  end if;

  for t in
    select transaction_id, sum(debit) d, sum(credit) c
    from public.ledger_entries group by transaction_id having sum(debit) <> sum(credit)
  loop
    perform public.record_admin_alert('LEDGER_TX_IMBALANCE', 'critical',
      'Transaction déséquilibrée : ' || t.transaction_id, null, null, null,
      jsonb_build_object('transaction_id', t.transaction_id, 'debit', t.d, 'credit', t.c));
  end loop;

  for o in
    select id from public.orders where status = 'TERMINEE'
      and not exists (select 1 from public.ledger_transactions lt where lt.idempotency_key = 'order_completed:' || id)
  loop
    perform public.record_admin_alert('LEDGER_MISSING_POSTING', 'warning',
      'Commande terminée sans écriture comptable.', o.id, null, null, '{}'::jsonb);
  end loop;
end;
$$;

-- ---------- Verrouillage des exécutions (pas d'appel client direct) ----------
do $$
declare f text; internal text[] := array[
  'gen_payment_ref()', 'post_ledger(text, text, jsonb)', '_lline(text, uuid, integer, integer)',
  'record_admin_alert(text, text, text, uuid, uuid, uuid, jsonb)',
  'settle_cod_j1()', 'settle_restaurants_weekly()', 'ledger_reconcile()' ];
begin
  foreach f in array internal loop
    execute format('revoke all on function public.%s from public', f);
    execute format('grant execute on function public.%s to service_role', f);
  end loop;
end $$;

do $$
declare f text; fin_rpc text[] := array[
  'payment_instructions(uuid)', 'finance_validate_payment(uuid)', 'finance_post(text, text, jsonb)' ];
begin
  foreach f in array fin_rpc loop
    execute format('revoke all on function public.%s from public', f);
    execute format('grant execute on function public.%s to authenticated, service_role', f);
  end loop;
end $$;

-- ---------- pg_cron : réconciliation quotidienne + règlements ----------
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    if exists (select 1 from cron.job where jobname = 'nova_ledger_reconcile') then perform cron.unschedule('nova_ledger_reconcile'); end if;
    if exists (select 1 from cron.job where jobname = 'nova_cod_j1') then perform cron.unschedule('nova_cod_j1'); end if;
    if exists (select 1 from cron.job where jobname = 'nova_resto_weekly') then perform cron.unschedule('nova_resto_weekly'); end if;
    perform cron.schedule('nova_ledger_reconcile', '0 3 * * *',  'select public.ledger_reconcile();');
    perform cron.schedule('nova_cod_j1',          '30 3 * * *', 'select public.settle_cod_j1();');
    perform cron.schedule('nova_resto_weekly',    '0 4 * * 1',  'select public.settle_restaurants_weekly();');
  end if;
end $$;
