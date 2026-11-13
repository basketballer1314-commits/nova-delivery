-- ============================================================
-- Nova Delivery — Tests pgTAP : moteur de dispatch (§10)
-- Lancé par `supabase test db` (Supabase local / Docker).
-- Le temps est simulé en antidatant created_at / search_started_at.
-- Couriers seed : 011, 012. Client A 021, resto Chez Fatou 1000…001.
-- ============================================================
create extension if not exists pgtap with schema extensions;

begin;
select plan(21);

create or replace function pg_temp.as_user(_uid text) returns void language sql as $$
  select set_config('request.jwt.claims',
    json_build_object('sub', _uid, 'role', 'authenticated')::text, true);
$$;

-- Points de référence
-- P (retrait) = -16.96 14.42 ; courier 012 ~1 km à l'est.
-- Couriers en ligne, approuvés, géolocalisés.
update courier_profiles set status='APPROUVE', availability='EN_LIGNE_LIBRE',
  last_location = ST_SetSRID(ST_MakePoint(-16.96,14.42),4326)::geography where id='00000000-0000-0000-0000-000000000011';
update courier_profiles set status='APPROUVE', availability='EN_LIGNE_LIBRE',
  last_location = ST_SetSRID(ST_MakePoint(-16.95,14.42),4326)::geography where id='00000000-0000-0000-0000-000000000012';

-- Commandes support (insert direct = pas de trigger AFTER UPDATE)
insert into orders (id, customer_id, restaurant_id, status, payment_method, items_total, total, idempotency_key, pricing_snapshot) values
  ('41000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000021','10000000-0000-0000-0000-000000000001','ACCEPTEE','cash',3500,3500,'disp-o1','{"courierShare":560}'),
  ('41000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000022','10000000-0000-0000-0000-000000000001','ACCEPTEE','cash',3000,3000,'disp-o2','{"courierShare":560}'),
  ('41000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000022','10000000-0000-0000-0000-000000000001','ACCEPTEE','cash',3000,3000,'disp-o3','{"courierShare":560}'),
  ('41000000-0000-0000-0000-00000000000e','00000000-0000-0000-0000-000000000021','10000000-0000-0000-0000-000000000001','ACCEPTEE','cash',3000,3000,'disp-oe','{"courierShare":560}'),
  ('41000000-0000-0000-0000-00000000000d','00000000-0000-0000-0000-000000000021','10000000-0000-0000-0000-000000000001','ACCEPTEE','cash',3000,3000,'disp-od','{"courierShare":560}'),
  ('41000000-0000-0000-0000-00000000000c','00000000-0000-0000-0000-000000000021','10000000-0000-0000-0000-000000000001','ACCEPTEE','cash',3000,3000,'disp-oc','{"courierShare":560}');

-- Commande resto sans réponse (créée il y a 9 min) et paiement mobile expiré (11 min)
insert into orders (id, customer_id, restaurant_id, status, payment_method, items_total, total, idempotency_key, created_at) values
  ('41000000-0000-0000-0000-0000000000a0','00000000-0000-0000-0000-000000000021','10000000-0000-0000-0000-000000000001','ENVOYEE_RESTAURANT','cash',3000,3000,'disp-or', now() - interval '9 minutes'),
  ('41000000-0000-0000-0000-0000000000b0','00000000-0000-0000-0000-000000000021','10000000-0000-0000-0000-000000000001','EN_ATTENTE_PAIEMENT','wave',3000,3000,'disp-op', now() - interval '11 minutes');

-- Jobs (pickup = P, rayon 5 km)
insert into delivery_jobs (id, job_type, order_id, status, pickup_location, search_radius_m, requires_cash, customer_id) values
  ('42000000-0000-0000-0000-000000000001','food','41000000-0000-0000-0000-000000000001','RECHERCHE', ST_SetSRID(ST_MakePoint(-16.96,14.42),4326)::geography, 5000, false, '00000000-0000-0000-0000-000000000021'),
  ('42000000-0000-0000-0000-000000000002','food','41000000-0000-0000-0000-000000000002','RECHERCHE', ST_SetSRID(ST_MakePoint(-16.96,14.42),4326)::geography, 5000, false, '00000000-0000-0000-0000-000000000011'),
  ('42000000-0000-0000-0000-000000000003','food','41000000-0000-0000-0000-000000000003','RECHERCHE', ST_SetSRID(ST_MakePoint(-16.96,14.42),4326)::geography, 5000, true,  '00000000-0000-0000-0000-000000000021');

-- Job escalade : en recherche depuis 7 min
insert into delivery_jobs (id, job_type, order_id, status, pickup_location, search_radius_m, requires_cash, customer_id, search_started_at) values
  ('42000000-0000-0000-0000-00000000000e','food','41000000-0000-0000-0000-00000000000e','RECHERCHE', ST_SetSRID(ST_MakePoint(-16.96,14.42),4326)::geography, 3000, false, '00000000-0000-0000-0000-000000000021', now() - interval '7 minutes');

-- ---- 1. Tri par distance : le plus proche (011) d'abord ----
select is(
  (select courier_id from dispatch_eligible_couriers('42000000-0000-0000-0000-000000000001') limit 1),
  '00000000-0000-0000-0000-000000000011'::uuid,
  'Candidat le plus proche proposé en premier'
);

-- ---- 2. RG-02 : livreur lié à la commande exclu ----
select is(
  (select count(*)::int from dispatch_eligible_couriers('42000000-0000-0000-0000-000000000002')
     where courier_id = '00000000-0000-0000-0000-000000000011'),
  0,
  'RG-02 : le livreur lié à la commande est exclu'
);

-- ---- 3. Espèces : BLOQUE_CAISSE exclu ----
update courier_profiles set availability='BLOQUE_CAISSE' where id='00000000-0000-0000-0000-000000000011';
select is(
  (select count(*)::int from dispatch_eligible_couriers('42000000-0000-0000-0000-000000000003')
     where courier_id = '00000000-0000-0000-0000-000000000011'),
  0,
  'Espèces : livreur BLOQUE_CAISSE exclu'
);
select is(
  (select count(*)::int from dispatch_eligible_couriers('42000000-0000-0000-0000-000000000003')
     where courier_id = '00000000-0000-0000-0000-000000000012'),
  1,
  'Espèces : livreur non bloqué reste éligible'
);
update courier_profiles set availability='EN_LIGNE_LIBRE' where id='00000000-0000-0000-0000-000000000011';

-- ---- 4. Faire une offre : une offre PENDING, job en OFFRE ----
select isnt(dispatch_make_offer('42000000-0000-0000-0000-000000000001'), null, 'Une offre est émise');
select is(
  (select count(*)::int from job_offers where job_id='42000000-0000-0000-0000-000000000001' and response='PENDING'),
  1,
  'Exactement une offre en attente'
);

-- ---- 5. Une offre à la fois ----
select is(dispatch_make_offer('42000000-0000-0000-0000-000000000001'), null, 'Pas de 2e offre tant que la 1re est en attente');

-- ---- 6. Acceptation par le livreur ----
set local role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-000000000011');
select courier_accept_offer((select id from job_offers where job_id='42000000-0000-0000-0000-000000000001' and response='PENDING' limit 1));
reset role;
select is((select status from delivery_jobs where id='42000000-0000-0000-0000-000000000001'), 'ASSIGNE', 'Course attribuée');
select is((select availability::text from courier_profiles where id='00000000-0000-0000-0000-000000000011'), 'EN_MISSION', 'Livreur passe EN_MISSION');
select is((select status::text from orders where id='41000000-0000-0000-0000-000000000001'), 'LIVREUR_ASSIGNE', 'Commande passe LIVREUR_ASSIGNE');

-- ---- 7. Refus d'offre → marqué DECLINED ----
insert into delivery_jobs (id, job_type, order_id, status, pickup_location, search_radius_m, requires_cash, customer_id) values
  ('42000000-0000-0000-0000-00000000000d','food','41000000-0000-0000-0000-00000000000d','RECHERCHE', ST_SetSRID(ST_MakePoint(-16.96,14.42),4326)::geography, 5000, false, '00000000-0000-0000-0000-000000000021');
select dispatch_make_offer('42000000-0000-0000-0000-00000000000d');  -- → 012 (011 est EN_MISSION)
set local role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-000000000012');
select courier_decline_offer((select id from job_offers where job_id='42000000-0000-0000-0000-00000000000d' and response='PENDING' limit 1));
reset role;
select is(
  (select count(*)::int from job_offers where job_id='42000000-0000-0000-0000-00000000000d' and response='DECLINED'),
  1,
  'Offre refusée marquée DECLINED'
);

-- ============================================================
-- Escalades temporelles (§10.3) : couriers hors ligne → aucun livreur
-- ============================================================
update courier_profiles set availability='HORS_LIGNE' where id in
  ('00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000012');

select dispatch_tick();

-- ---- 8. Aucun livreur : rayon élargi (2 min), bonus +200 (4 min), alerte (6 min) ----
select ok((select escalations ? 'widen' from delivery_jobs where id='42000000-0000-0000-0000-00000000000e'),
  'Rayon élargi à 2 min');
select ok((select escalations ? 'bonus' from delivery_jobs where id='42000000-0000-0000-0000-00000000000e'),
  'Bonus appliqué à 4 min');
select is((select bonus from delivery_jobs where id='42000000-0000-0000-0000-00000000000e'), 200, 'Bonus = 200 FCFA');
select is(
  (select count(*)::int from admin_alerts where type='NO_COURIER' and job_id='42000000-0000-0000-0000-00000000000e'),
  1,
  'Alerte dispatch « aucun livreur » à 6 min'
);

-- ---- 9. Restaurant sans réponse → annulation à 8 min + alerte support ----
select is((select status::text from orders where id='41000000-0000-0000-0000-0000000000a0'), 'ANNULEE',
  'Commande annulée (restaurant sans réponse 8 min)');
select is(
  (select count(*)::int from admin_alerts where type='RESTO_NO_RESPONSE' and order_id='41000000-0000-0000-0000-0000000000a0'),
  1,
  'Alerte support restaurant sans réponse (3 min)'
);

-- ---- 10. Paiement mobile en attente > 10 min → expiration ----
select is((select status::text from orders where id='41000000-0000-0000-0000-0000000000b0'), 'ANNULEE',
  'Paiement mobile expiré → commande annulée');
select is(
  (select count(*)::int from admin_alerts where type='PAYMENT_EXPIRED' and order_id='41000000-0000-0000-0000-0000000000b0'),
  1,
  'Alerte paiement expiré'
);

-- ============================================================
-- 11. Annulation après acceptation → suspension à la 3e / semaine
-- ============================================================
-- 2 annulations injustifiées déjà cette semaine
insert into courier_cancellations (courier_id, justified, created_at) values
  ('00000000-0000-0000-0000-000000000011', false, now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000000011', false, now() - interval '1 day');
-- Mission active attribuée au livreur 011
insert into delivery_jobs (id, job_type, order_id, status, pickup_location, requires_cash, customer_id, courier_id, assigned_at) values
  ('42000000-0000-0000-0000-00000000000c','food','41000000-0000-0000-0000-00000000000c','ASSIGNE', ST_SetSRID(ST_MakePoint(-16.96,14.42),4326)::geography, false, '00000000-0000-0000-0000-000000000021','00000000-0000-0000-0000-000000000011', now());

set local role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-000000000011');
select courier_cancel_job('42000000-0000-0000-0000-00000000000c', 'imprévu');
reset role;

select is((select status::text from courier_profiles where id='00000000-0000-0000-0000-000000000011'), 'SUSPENDU',
  'Livreur suspendu après 3 annulations injustifiées / semaine');
select is(
  (select count(*)::int from admin_alerts where type='COURIER_SUSPENDU' and courier_id='00000000-0000-0000-0000-000000000011'),
  1,
  'Alerte suspension livreur'
);

select * from finish();
rollback;
