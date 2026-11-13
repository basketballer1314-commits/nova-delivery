-- ============================================================
-- Nova Delivery — Tests pgTAP : argent / grand livre (§11.2)
-- Chaque scénario produit des écritures équilibrées (Σdébit = Σcrédit).
-- Lancé par `supabase test db` (Supabase local / Docker).
-- ============================================================
create extension if not exists pgtap with schema extensions;

begin;
select plan(21);

create or replace function pg_temp.as_user(_uid text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', _uid, 'role', 'authenticated')::text, true);
$$;

-- Helper : solde d'un compte
create or replace function pg_temp.bal(_acct text, _id uuid) returns bigint language sql as $$
  select coalesce(sum(credit - debit), 0)::bigint from public.ledger_entries
   where account_type = _acct and (_id is null or account_id = _id);
$$;
-- Helper : (dé)séquilibre d'une transaction par sa clé d'idempotence
create or replace function pg_temp.tx_imbalance(_key text) returns bigint language sql as $$
  select coalesce(sum(debit - credit), 0)::bigint from public.ledger_entries
   where transaction_id = (select id from public.ledger_transactions where idempotency_key = _key);
$$;

-- Vendeur = admin 001 lié à Chez Fatou (R1), 10 % de commission
update restaurants set seller_id='00000000-0000-0000-0000-000000000001', seller_commission_pct=10
  where id='10000000-0000-0000-0000-000000000001';

-- ---------- Scénario 1 : commande repas terminée ----------
insert into orders (id, customer_id, restaurant_id, status, payment_method, items_total, delivery_fee, service_fee, discount_total, total, idempotency_key, pricing_snapshot) values
  ('43000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000021','10000000-0000-0000-0000-000000000001','LIVREE','cash',6500,700,100,0,7300,'m-o1','{"commission":325,"courierShare":560}');
insert into delivery_jobs (id, job_type, order_id, status, courier_id, assigned_at) values
  ('44000000-0000-0000-0000-000000000001','food','43000000-0000-0000-0000-000000000001','ASSIGNE','00000000-0000-0000-0000-000000000011', now());
update orders set status='TERMINEE' where id='43000000-0000-0000-0000-000000000001';  -- → trigger post_ledger

select is(pg_temp.tx_imbalance('order_completed:43000000-0000-0000-0000-000000000001'), 0::bigint, 'Commande terminée : écriture équilibrée');
select is(pg_temp.bal('resto_payable','10000000-0000-0000-0000-000000000001'), 6175::bigint, 'Dû restaurant = articles - commission');
select is(pg_temp.bal('courier_payable','00000000-0000-0000-0000-000000000011'), 560::bigint, 'Part livreur (80 % des frais)');
select is(pg_temp.bal('platform_commission', null), 325::bigint, 'Commission plateforme');
select is(pg_temp.bal('platform_service_fee', null), 100::bigint, 'Frais de service plateforme');
select is((select balance_due from v_seller_balances where seller_id='00000000-0000-0000-0000-000000000001'), 33::bigint, 'Commission vendeur (10 % de la commission)');

-- ---------- Scénario 2 : espèces encaissées par le livreur ----------
select post_ledger('cash_collected','m-cash1', jsonb_build_object('courier_id','00000000-0000-0000-0000-000000000011','amount',7300));
select is(pg_temp.tx_imbalance('m-cash1'), 0::bigint, 'Espèces encaissées : équilibré');
select is((select cash_held from v_courier_balances where courier_id='00000000-0000-0000-0000-000000000011'), 7300::bigint, 'Caisse livreur = espèces détenues');

-- ---------- Scénario 3 : versement des espèces à la plateforme ----------
select post_ledger('cash_remittance','m-rem1', jsonb_build_object('courier_id','00000000-0000-0000-0000-000000000011','amount',7300));
select is((select cash_held from v_courier_balances where courier_id='00000000-0000-0000-0000-000000000011'), 0::bigint, 'Caisse livreur soldée après versement');

-- ---------- Scénario 4 : contre-remboursement encaissé ----------
select post_ledger('cod_collected','m-cod1', jsonb_build_object('courier_id','00000000-0000-0000-0000-000000000011','sender_id','00000000-0000-0000-0000-000000000021','amount',5000));
select is(pg_temp.tx_imbalance('m-cod1'), 0::bigint, 'CR encaissé : équilibré');
select is(pg_temp.bal('cod_payable','00000000-0000-0000-0000-000000000021'), 5000::bigint, 'CR dû à l''expéditeur');

-- ---------- Scénario 5 : reversement CR J+1 ----------
select settle_cod_j1();
select is(pg_temp.bal('cod_payable','00000000-0000-0000-0000-000000000021'), 0::bigint, 'CR reversé J+1');

-- ---------- Scénario 6 : colis terminé ----------
insert into parcels (id, sender_id, status, recipient_name, recipient_phone, idempotency_key, price, pricing_snapshot) values
  ('50000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-000000000021','LIVRE','Dest','+221780000099','m-p1',1200,'{"baseFee":1000,"heavy":0,"codFee":200,"courierShare":800}');
insert into delivery_jobs (id, job_type, parcel_id, status, courier_id, assigned_at) values
  ('44000000-0000-0000-0000-0000000000a1','parcel','50000000-0000-0000-0000-0000000000a1','ASSIGNE','00000000-0000-0000-0000-000000000012', now());
update parcels set status='TERMINE' where id='50000000-0000-0000-0000-0000000000a1';

select is(pg_temp.tx_imbalance('parcel_completed:50000000-0000-0000-0000-0000000000a1'), 0::bigint, 'Colis terminé : équilibré');
select is(pg_temp.bal('courier_payable','00000000-0000-0000-0000-000000000012'), 800::bigint, 'Part livreur colis');

-- ---------- Scénario 7 : remboursement (plateforme / restaurant) ----------
select post_ledger('refund','m-ref1', jsonb_build_object('amount',1000,'imputation','platform'));
select is(pg_temp.tx_imbalance('m-ref1'), 0::bigint, 'Remboursement plateforme : équilibré');
select post_ledger('refund','m-ref2', jsonb_build_object('amount',500,'imputation','restaurant','account_id','10000000-0000-0000-0000-000000000002'));
select is(pg_temp.tx_imbalance('m-ref2'), 0::bigint, 'Remboursement imputé au restaurant : équilibré');

-- ---------- Scénario 8 : reversement restaurant hebdomadaire ----------
select settle_restaurants_weekly();
select is((select balance_due from v_restaurant_balances where restaurant_id='10000000-0000-0000-0000-000000000001'), 0::bigint, 'Dû restaurant soldé après reversement');

-- ---------- Scénario 9 : paiement manuel Wave validé par la finance ----------
insert into orders (id, customer_id, restaurant_id, status, payment_method, items_total, delivery_fee, service_fee, total, idempotency_key, pricing_snapshot) values
  ('43000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000021','10000000-0000-0000-0000-000000000001','EN_ATTENTE_PAIEMENT','wave',2800,100,100,3000,'m-o2','{"commission":140,"courierShare":80}');
set local role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-000000000001');  -- admin finance
select finance_validate_payment('43000000-0000-0000-0000-000000000002');
reset role;
select is((select status::text from orders where id='43000000-0000-0000-0000-000000000002'), 'ENVOYEE_RESTAURANT', 'Paiement validé → commande au restaurant');
select is(pg_temp.tx_imbalance('capture:43000000-0000-0000-0000-000000000002'), 0::bigint, 'Capture mobile : équilibré');
select is((select count(*)::int from payments where order_id='43000000-0000-0000-0000-000000000002' and status='PAYE'), 1, 'Paiement enregistré PAYE');

-- ---------- Réconciliation : aucun écart ----------
select ledger_reconcile();
select is((select count(*)::int from admin_alerts where type in ('LEDGER_IMBALANCE','LEDGER_TX_IMBALANCE')), 0, 'Réconciliation : aucun déséquilibre');

select * from finish();
rollback;
