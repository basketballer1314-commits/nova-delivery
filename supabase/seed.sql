-- ============================================================
-- Nova Delivery — Seed (destiné à `supabase db reset` en local)
-- Crée des auth.users de test → déconseillé sur une base partagée.
-- ============================================================
set search_path = public, extensions;

-- ---------- Ville ----------
insert into cities (id, name, slug, region, active) values
  (1, 'Mbour', 'mbour', 'Thiès', true)
on conflict (id) do nothing;

-- ---------- Zones (polygones approximatifs autour de chaque localité) ----------
insert into zones (id, city_id, name, slug, number, active, area) values
  (1, 1, 'Mbour',                     'mbour',      1, true,
     ST_SetSRID(ST_GeomFromText('POLYGON((-16.98 14.40,-16.95 14.40,-16.95 14.43,-16.98 14.43,-16.98 14.40))'),4326)::geography),
  (2, 1, 'Saly',                      'saly',       2, true,
     ST_SetSRID(ST_GeomFromText('POLYGON((-17.02 14.43,-16.99 14.43,-16.99 14.46,-17.02 14.46,-17.02 14.43))'),4326)::geography),
  (3, 1, 'Ngaparou',                  'ngaparou',   3, true,
     ST_SetSRID(ST_GeomFromText('POLYGON((-17.04 14.42,-17.01 14.42,-17.01 14.45,-17.04 14.45,-17.04 14.42))'),4326)::geography),
  (4, 1, 'Somone',                    'somone',     4, true,
     ST_SetSRID(ST_GeomFromText('POLYGON((-17.06 14.48,-17.03 14.48,-17.03 14.51,-17.06 14.51,-17.06 14.48))'),4326)::geography),
  (5, 1, 'Malicounda/Warang/Nianing', 'malicounda', 5, false,
     ST_SetSRID(ST_GeomFromText('POLYGON((-16.92 14.45,-16.88 14.45,-16.88 14.49,-16.92 14.49,-16.92 14.45))'),4326)::geography)
on conflict (id) do update set area = excluded.area, active = excluded.active;

-- ---------- Grilles tarifaires ----------
insert into zone_prices (service, from_zone, to_zone, price) values
  ('parcel',1,1,1000),('parcel',2,2,1000),('parcel',3,3,1000),('parcel',4,4,1000),
  ('parcel',1,2,1500),('parcel',2,1,1500),('parcel',2,3,1500),('parcel',3,2,1500),('parcel',3,4,1500),('parcel',4,3,1500),
  ('parcel',1,3,2000),('parcel',3,1,2000),('parcel',2,4,2000),('parcel',4,2,2000),
  ('parcel',1,4,2500),('parcel',4,1,2500),
  ('food',1,1,700),('food',2,2,700),('food',3,3,700),('food',4,4,700),
  ('food',1,2,1000),('food',2,1,1000),('food',2,3,1000),('food',3,2,1000),('food',3,4,1000),('food',4,3,1000),
  ('food',1,3,1500),('food',3,1,1500),('food',2,4,1500),('food',4,2,1500),
  ('food',1,4,2000),('food',4,1,2000)
on conflict (service, from_zone, to_zone) where valid_to is null do nothing;

-- ---------- Paramètres plateforme ----------
insert into settings (key, value) values
  ('platform_name', '"NOVA"'),
  ('platform_commission_pct', '20'),
  ('restaurant_commission_intro_pct', '5'),
  ('restaurant_commission_standard_pct', '10'),
  ('restaurant_commission_intro_days', '30'),
  ('service_fee_fcfa', '100'),
  ('service_fee_free_first_order', 'true'),
  ('night_supplement_fcfa', '300'),
  ('night_start_hour', '22'),
  ('rain_supplement_pct', '100'),
  ('parcel_heavy_threshold_kg', '5'),
  ('parcel_heavy_supplement_fcfa', '500'),
  ('cash_driver_limit_fcfa', '30000'),
  ('cash_new_client_limit_fcfa', '15000'),
  ('cash_new_client_min_orders', '3'),
  ('cod_min_fee_fcfa', '200'),
  ('cod_pct', '1'),
  ('cod_max_fcfa', '100000'),
  ('offer_timeout_seconds', '45')
on conflict (key) do update set value = excluded.value;

-- ---------- Utilisateurs de test (auth.users → profils créés par trigger) ----------
-- Mots de passe = 'password'. IDs fixes pour les tests pgTAP.
do $$
declare
  u record;
begin
  for u in
    select * from (values
      ('00000000-0000-0000-0000-000000000001'::uuid, '+221770000001', 'Admin Test',   'admin@test.local'),
      ('00000000-0000-0000-0000-000000000011'::uuid, '+221770000011', 'Livreur Un',    'courier1@test.local'),
      ('00000000-0000-0000-0000-000000000012'::uuid, '+221770000012', 'Livreur Deux',  'courier2@test.local'),
      ('00000000-0000-0000-0000-000000000021'::uuid, '+221770000021', 'Client A',      'client1@test.local'),
      ('00000000-0000-0000-0000-000000000022'::uuid, '+221770000022', 'Client B',      'client2@test.local'),
      ('00000000-0000-0000-0000-000000000031'::uuid, '+221770000031', 'Fatou Owner',   'owner@test.local'),
      ('00000000-0000-0000-0000-000000000032'::uuid, '+221770000032', 'Caissier Resto','cashier@test.local')
    ) as v(id, phone, full_name, email)
  loop
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, phone, phone_confirmed_at
    ) values (
      '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated',
      u.email, crypt('password', gen_salt('bf')), now(),
      '{"provider":"phone","providers":["phone"]}'::jsonb,
      jsonb_build_object('full_name', u.full_name),
      now(), now(), u.phone, now()
    ) on conflict (id) do nothing;
  end loop;
end $$;

-- ---------- Restaurants (3 fictifs, dont « Chez Fatou ») ----------
insert into restaurants (id, owner_id, name, slug, city_id, zone_id, status, phone, address, commission_rate) values
  ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000031','Chez Fatou',        'chez-fatou',        1, 2, 'ACTIF', '+221770000031', 'Saly Centre',   5.00),
  ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000031','Le Baobab',         'le-baobab',         1, 1, 'ACTIF', '+221770000031', 'Mbour Escale',  10.00),
  ('10000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000031','Thiof Gourmand',    'thiof-gourmand',    1, 3, 'ACTIF', '+221770000031', 'Ngaparou',      10.00)
on conflict (id) do nothing;

-- ---------- Rôles ----------
insert into user_roles (user_id, role, restaurant_id) values
  ('00000000-0000-0000-0000-000000000001','admin_super', null),
  ('00000000-0000-0000-0000-000000000011','courier',     null),
  ('00000000-0000-0000-0000-000000000012','courier',     null),
  ('00000000-0000-0000-0000-000000000021','client',      null),
  ('00000000-0000-0000-0000-000000000022','client',      null),
  ('00000000-0000-0000-0000-000000000031','resto_owner', '10000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000032','resto_staff', '10000000-0000-0000-0000-000000000001')
on conflict (user_id, role, restaurant_id) do nothing;

insert into restaurant_members (restaurant_id, user_id, member_role) values
  ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000031','resto_owner'),
  ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000032','resto_staff')
on conflict (restaurant_id, user_id) do nothing;

-- ---------- Profils livreurs ----------
insert into courier_profiles (id, status, availability, vehicle_type) values
  ('00000000-0000-0000-0000-000000000011','APPROUVE','EN_LIGNE_LIBRE','moto'),
  ('00000000-0000-0000-0000-000000000012','APPROUVE','HORS_LIGNE','moto')
on conflict (id) do nothing;

-- ---------- Menus ----------
insert into menu_categories (id, restaurant_id, name, position) values
  ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Plats', 0),
  ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','Boissons', 1)
on conflict (id) do nothing;

insert into menu_items (id, restaurant_id, category_id, name, description, price) values
  ('21000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Thieboudienne','Riz au poisson', 3500),
  ('21000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Yassa Poulet','Poulet oignons citron', 3000),
  ('21000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002','Bissap','Jus d''hibiscus', 500)
on conflict (id) do nothing;

-- ---------- Adresses de test ----------
insert into addresses (id, user_id, label, quartier, zone_id, location) values
  ('30000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000021','Maison','Saly', 2,
     ST_SetSRID(ST_MakePoint(-17.00,14.44),4326)::geography),
  ('30000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000021','Bureau','Mbour',1,
     ST_SetSRID(ST_MakePoint(-16.96,14.42),4326)::geography)
on conflict (id) do nothing;

-- ---------- Commande de test (appartient au Client A) ----------
insert into orders (id, customer_id, restaurant_id, status, delivery_address_id, zone_from, zone_to,
                    payment_method, items_total, delivery_fee, service_fee, total, idempotency_key) values
  ('40000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000021','10000000-0000-0000-0000-000000000001',
   'ACCEPTEE','30000000-0000-0000-0000-000000000001',2,2,'cash',6500,700,100,7300,'seed-order-1')
on conflict (id) do nothing;

insert into order_items (order_id, menu_item_id, name_snapshot, unit_price, quantity, line_total) values
  ('40000000-0000-0000-0000-000000000001','21000000-0000-0000-0000-000000000001','Thieboudienne',3500,1,3500),
  ('40000000-0000-0000-0000-000000000001','21000000-0000-0000-0000-000000000002','Yassa Poulet',3000,1,3000);

-- ---------- Colis de test (appartient au Client A, non encore accepté) ----------
insert into parcels (id, sender_id, status, pickup_address_id, dropoff_address_id, zone_from, zone_to,
                    declared_value, recipient_name, recipient_phone, idempotency_key, price) values
  ('50000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000021','RECHERCHE_LIVREUR',
   '30000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000002',2,1,
   10000,'Destinataire Test','+221780000099','seed-parcel-1',1500)
on conflict (id) do nothing;

-- Mission colis proposée au Livreur Un mais PAS encore acceptée (assigned_at null → RG-22)
insert into delivery_jobs (id, job_type, parcel_id, courier_id, status) values
  ('60000000-0000-0000-0000-000000000001','parcel','50000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000011','ASSIGNATION')
on conflict (id) do nothing;

insert into job_offers (job_id, courier_id, expires_at) values
  ('60000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011', now() + interval '45 seconds')
on conflict do nothing;

-- ---------- Écriture au grand livre (équilibrée) pour tester l'accès finances ----------
insert into ledger_entries (transaction_id, account_type, account_id, debit, credit, reference) values
  ('70000000-0000-0000-0000-000000000001','customer','00000000-0000-0000-0000-000000000021',7300,0,'seed-order-1'),
  ('70000000-0000-0000-0000-000000000001','platform',null,0,7300,'seed-order-1');
