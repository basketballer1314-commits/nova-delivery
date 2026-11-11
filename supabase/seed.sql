-- Seed : zones, grille de prix, données de test
-- À exécuter après les migrations : supabase db reset

-- ============================================================
-- EXTENSIONS
-- ============================================================
create extension if not exists postgis;
create extension if not exists pg_cron;

-- ============================================================
-- ZONES
-- ============================================================
insert into zones (id, name, slug, active) values
  (1, 'Mbour',                    'mbour',     true),
  (2, 'Saly',                     'saly',      true),
  (3, 'Ngaparou',                 'ngaparou',  true),
  (4, 'Somone',                   'somone',    true),
  (5, 'Malicounda/Warang/Nianing','malicounda', false)
on conflict (id) do nothing;

-- ============================================================
-- GRILLE TARIFAIRE COLIS (jusqu'à 5 kg)
-- ============================================================
insert into parcel_pricing (zone_from, zone_to, price_fcfa) values
  (1,1,1000),(2,2,1000),(3,3,1000),(4,4,1000),
  (1,2,1500),(2,1,1500),(2,3,1500),(3,2,1500),(3,4,1500),(4,3,1500),
  (1,3,2000),(3,1,2000),(2,4,2000),(4,2,2000),
  (1,4,2500),(4,1,2500)
on conflict (zone_from, zone_to) do nothing;

-- ============================================================
-- GRILLE TARIFAIRE REPAS
-- ============================================================
insert into meal_delivery_pricing (zone_from, zone_to, price_fcfa) values
  (1,1,700),(2,2,700),(3,3,700),(4,4,700),
  (1,2,1000),(2,1,1000),(2,3,1000),(3,2,1000),(3,4,1000),(4,3,1000),
  (1,3,1500),(3,1,1500),(2,4,1500),(4,2,1500),
  (1,4,2000),(4,1,2000)
on conflict (zone_from, zone_to) do nothing;

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
