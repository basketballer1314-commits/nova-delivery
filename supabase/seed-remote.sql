-- ============================================================
-- Nova Delivery — Seed DISTANT (à coller dans le SQL Editor Supabase)
-- Ne crée AUCUN auth.users (pas d'écriture dans le schéma auth).
-- Idempotent : relançable sans doublon.
-- Objectif : alimenter cities/zones/zone_prices/settings + 1 resto + menu
-- pour tester quote-food / create-order / check_zone.
-- ============================================================
set search_path = public, extensions;

-- ---------- Ville ----------
insert into cities (id, name, slug, region, active) values
  (1, 'Mbour', 'mbour', 'Thiès', true)
on conflict (id) do nothing;

-- ---------- Zones + polygones approximatifs ----------
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

-- ---------- Grilles tarifaires (colis + repas) ----------
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

-- ---------- Restaurant ACTIF « Chez Fatou » (sans owner, commission 10 %) ----------
insert into restaurants (id, owner_id, name, slug, city_id, zone_id, status, phone, address,
                         commission_rate, prep_time_minutes, rating_avg, rating_count) values
  ('10000000-0000-0000-0000-000000000001', null, 'Chez Fatou', 'chez-fatou', 1, 2, 'ACTIF',
   '+221770000031', 'Saly Centre', 10.00, 25, 4.6, 128)
on conflict (id) do update set status = excluded.status, zone_id = excluded.zone_id,
  commission_rate = excluded.commission_rate, prep_time_minutes = excluded.prep_time_minutes,
  rating_avg = excluded.rating_avg, rating_count = excluded.rating_count;

-- Horaires (tous les jours 09:00–23:00)
insert into restaurant_hours (restaurant_id, weekday, open_time, close_time)
select '10000000-0000-0000-0000-000000000001', d, '09:00', '23:00'
from generate_series(0,6) d
on conflict do nothing;

-- ---------- Menu ----------
insert into menu_categories (id, restaurant_id, name, position) values
  ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Plats', 0),
  ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','Boissons', 1)
on conflict (id) do nothing;

insert into menu_items (id, restaurant_id, category_id, name, description, price, available) values
  ('21000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Thieboudienne','Riz au poisson', 3500, true),
  ('21000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Yassa Poulet','Poulet oignons citron', 3000, true),
  ('21000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002','Bissap','Jus d''hibiscus', 500, true)
on conflict (id) do nothing;
