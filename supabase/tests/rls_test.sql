-- ============================================================
-- Nova Delivery — Tests pgTAP : règles RLS
-- Lancé par `supabase test db` (nécessite Supabase local / Docker).
-- Les IDs correspondent au seed.
-- ============================================================
create extension if not exists pgtap with schema extensions;

begin;
select plan(5);

-- ---- 1. Un client ne voit pas la commande d'un autre ----
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000022","role":"authenticated"}', true); -- Client B
select is(
  (select count(*)::int from orders where id = '40000000-0000-0000-0000-000000000001'),
  0,
  'Client B ne voit pas la commande du Client A'
);

-- ---- 2. Un livreur ne voit pas le téléphone du client avant acceptation (RG-22) ----
reset role;
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000011","role":"authenticated"}', true); -- Livreur Un (non accepté)
select is(
  (select count(*)::int from get_job_contact('60000000-0000-0000-0000-000000000001')),
  0,
  'Livreur : get_job_contact ne renvoie rien avant acceptation'
);
select is(
  (select count(*)::int from parcels where id = '50000000-0000-0000-0000-000000000001'),
  0,
  'Livreur : aucun accès direct au colis (donc au téléphone)'
);

-- ---- 3. Un caissier (resto_staff) ne voit pas les finances ----
reset role;
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000032","role":"authenticated"}', true); -- Caissier
select is(
  (select count(*)::int from ledger_entries),
  0,
  'Caissier ne voit pas le grand livre'
);

-- ---- 4. authenticated ne peut pas modifier orders.total ----
reset role;
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000021","role":"authenticated"}', true); -- Client A (propriétaire)
update orders set total = 0 where id = '40000000-0000-0000-0000-000000000001'; -- bloqué par RLS (0 ligne)
select is(
  (select total from orders where id = '40000000-0000-0000-0000-000000000001'),
  7300,
  'authenticated ne peut pas modifier orders.total'
);

reset role;
select * from finish();
rollback;
