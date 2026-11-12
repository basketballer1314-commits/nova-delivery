-- Seed : ville, zones, grille de prix, paramètres plateforme
-- À exécuter après les migrations (supabase db reset) ou via l'éditeur SQL distant.

-- ============================================================
-- VILLE
-- ============================================================
insert into cities (id, name, slug, region, active) values
  (1, 'Petite-Côte', 'petite-cote', 'Thiès', true)
on conflict (id) do nothing;

-- ============================================================
-- ZONES (Mbour=1, Saly=2, Ngaparou=3, Somone=4, Malicounda/Warang/Nianing=5)
-- Polygones (area) ajoutés ultérieurement.
-- ============================================================
insert into zones (id, city_id, name, slug, number, active) values
  (1, 1, 'Mbour',                     'mbour',      1, true),
  (2, 1, 'Saly',                      'saly',       2, true),
  (3, 1, 'Ngaparou',                  'ngaparou',   3, true),
  (4, 1, 'Somone',                    'somone',     4, true),
  (5, 1, 'Malicounda/Warang/Nianing', 'malicounda', 5, false)
on conflict (id) do nothing;

-- ============================================================
-- GRILLE TARIFAIRE COLIS (service = parcel, jusqu'à 5 kg)
-- ============================================================
insert into zone_prices (service, from_zone, to_zone, price) values
  ('parcel',1,1,1000),('parcel',2,2,1000),('parcel',3,3,1000),('parcel',4,4,1000),
  ('parcel',1,2,1500),('parcel',2,1,1500),('parcel',2,3,1500),('parcel',3,2,1500),('parcel',3,4,1500),('parcel',4,3,1500),
  ('parcel',1,3,2000),('parcel',3,1,2000),('parcel',2,4,2000),('parcel',4,2,2000),
  ('parcel',1,4,2500),('parcel',4,1,2500)
on conflict (service, from_zone, to_zone) where valid_to is null do nothing;

-- ============================================================
-- GRILLE TARIFAIRE REPAS (service = food)
-- ============================================================
insert into zone_prices (service, from_zone, to_zone, price) values
  ('food',1,1,700),('food',2,2,700),('food',3,3,700),('food',4,4,700),
  ('food',1,2,1000),('food',2,1,1000),('food',2,3,1000),('food',3,2,1000),('food',3,4,1000),('food',4,3,1000),
  ('food',1,3,1500),('food',3,1,1500),('food',2,4,1500),('food',4,2,1500),
  ('food',1,4,2000),('food',4,1,2000)
on conflict (service, from_zone, to_zone) where valid_to is null do nothing;

-- ============================================================
-- SETTINGS PLATEFORME
-- ============================================================
insert into settings (key, value) values
  ('platform_name',                      '"NOVA"'),
  ('platform_commission_pct',            '20'),
  ('restaurant_commission_intro_pct',    '5'),
  ('restaurant_commission_standard_pct', '10'),
  ('restaurant_commission_intro_days',   '30'),
  ('service_fee_fcfa',                   '100'),
  ('service_fee_free_first_order',       'true'),
  ('night_supplement_fcfa',              '300'),
  ('night_start_hour',                   '22'),
  ('rain_supplement_pct',                '100'),
  ('parcel_heavy_threshold_kg',          '5'),
  ('parcel_heavy_supplement_fcfa',       '500'),
  ('cash_driver_limit_fcfa',             '30000'),
  ('cash_new_client_limit_fcfa',         '15000'),
  ('cash_new_client_min_orders',         '3'),
  ('cod_min_fee_fcfa',                   '200'),
  ('cod_pct',                            '1'),
  ('cod_max_fcfa',                       '100000'),
  ('offer_timeout_seconds',              '45')
on conflict (key) do update set value = excluded.value;
