-- ============================================================
-- Nova Delivery — Tests pgTAP : RPC espace restaurant (/resto)
-- Lancé par `supabase test db` (nécessite Supabase local / Docker).
-- IDs : seed (Chez Fatou 1000…001, owner …031, caissier …032, Client B …022).
-- Les commandes de test sont insérées en rôle superuser (bypass RLS) puis
-- les RPC sont appelées en rôle authenticated avec les claims JWT voulus.
-- ============================================================
create extension if not exists pgtap with schema extensions;

begin;
select plan(7);

-- Claims helper : positionne l'utilisateur courant.
create or replace function pg_temp.as_user(_uid text) returns void language sql as $$
  select set_config('request.jwt.claims',
    json_build_object('sub', _uid, 'role', 'authenticated')::text, true);
$$;

-- Commandes de test en ENVOYEE_RESTAURANT (insérées en superuser).
insert into orders (id, customer_id, restaurant_id, status, payment_method, items_total, total, idempotency_key)
values
  ('4f000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000021','10000000-0000-0000-0000-000000000001','ENVOYEE_RESTAURANT','cash',3500,3500,'test-resto-1'),
  ('4f000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000021','10000000-0000-0000-0000-000000000001','ENVOYEE_RESTAURANT','cash',3000,3000,'test-resto-2'),
  ('4f000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000021','10000000-0000-0000-0000-000000000001','ENVOYEE_RESTAURANT','cash',3000,3000,'test-resto-3'),
  ('4f000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000021','10000000-0000-0000-0000-000000000001','ENVOYEE_RESTAURANT','cash',3000,3000,'test-resto-4');

update restaurants set consecutive_refusals = 0, paused_until = null
  where id = '10000000-0000-0000-0000-000000000001';

-- ---- 1. Un non-membre ne peut pas refuser une commande du restaurant ----
set local role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-000000000022'); -- Client B
select throws_ok(
  $$ select resto_refuse_order('4f000000-0000-0000-0000-000000000001','rupture') $$,
  'non autorisé',
  'Non-membre : refus bloqué'
);

-- ---- 2. Un membre (caissier) accepte en un geste → ACCEPTEE + délai figé ----
select pg_temp.as_user('00000000-0000-0000-0000-000000000032'); -- Caissier (resto_staff)
select lives_ok(
  $$ select resto_accept_order('4f000000-0000-0000-0000-000000000001', 20) $$,
  'Membre : accepte la commande'
);
select is(
  (select status::text || ':' || prep_minutes::text from orders where id = '4f000000-0000-0000-0000-000000000001'),
  'ACCEPTEE:20',
  'Commande acceptée avec temps de préparation figé'
);

-- ---- 3. Motif de refus invalide rejeté ----
select throws_ok(
  $$ select resto_refuse_order('4f000000-0000-0000-0000-000000000002','autre_motif') $$,
  'motif de refus invalide',
  'Refus : motif hors liste rejeté'
);

-- ---- 4. RG-18 : 3 refus consécutifs → pause auto + ticket + compteur remis à 0 ----
select resto_refuse_order('4f000000-0000-0000-0000-000000000002','rupture');
select resto_refuse_order('4f000000-0000-0000-0000-000000000003','fermeture');
select resto_refuse_order('4f000000-0000-0000-0000-000000000004','trop_de_commandes');

select isnt(
  (select paused_until from restaurants where id = '10000000-0000-0000-0000-000000000001'),
  null,
  'RG-18 : restaurant mis en pause après 3 refus'
);
select is(
  (select consecutive_refusals from restaurants where id = '10000000-0000-0000-0000-000000000001'),
  0,
  'RG-18 : compteur de refus remis à zéro'
);
select is(
  (select count(*)::int from tickets
     where user_id = '00000000-0000-0000-0000-000000000031' and priority = 'HAUTE'),
  1,
  'RG-18 : ticket commercial créé pour le propriétaire'
);

reset role;
select * from finish();
rollback;
