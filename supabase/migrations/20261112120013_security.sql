-- ============================================================
-- Nova Delivery — Migration 13 : Sécurité (fonctions + RLS + policies)
-- Modèle : default-deny. Les Edge Functions utilisent service_role
-- (BYPASSRLS) ; le client (authenticated) ne peut jamais écrire un
-- montant, un statut de paiement ou le registre directement.
-- NB : la matrice §6 et RG-22 sont implémentées de façon raisonnable
--      (détails §6 non fournis → lecture = is_admin()).
-- ============================================================
set search_path = public, extensions;

-- ---------- Fonctions d'autorisation (SECURITY DEFINER, STABLE) ----------

create or replace function public.has_role(_role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = _role
  );
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
      and role in ('admin_super','admin_ops','admin_finance','admin_support','admin_sales','admin_auditor')
  );
$$;

create or replace function public.is_finance_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
      and role in ('admin_super','admin_finance','admin_auditor')
  );
$$;

create or replace function public.is_restaurant_member(_restaurant_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.restaurant_members
    where restaurant_id = _restaurant_id and user_id = auth.uid()
  ) or exists (
    select 1 from public.restaurants
    where id = _restaurant_id and owner_id = auth.uid()
  );
$$;

create or replace function public.is_restaurant_owner(_restaurant_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.restaurants
    where id = _restaurant_id and owner_id = auth.uid()
  );
$$;

create or replace function public.current_courier_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.courier_profiles where id = auth.uid();
$$;

-- Accès au contact client : seulement après acceptation et jusqu'à 2 h
-- après la livraison (RG-22). Le livreur ne voit JAMAIS le téléphone
-- directement (pas de policy select sur parcels/orders pour lui) ; il
-- passe par cette fonction serveur.
create or replace function public.get_job_contact(_job_id uuid)
returns table (recipient_name text, recipient_phone text)
language plpgsql stable security definer set search_path = public as $$
begin
  return query
  select p.recipient_name, p.recipient_phone
  from public.delivery_jobs dj
  join public.parcels p on p.id = dj.parcel_id
  where dj.id = _job_id
    and dj.courier_id = auth.uid()
    and dj.assigned_at is not null
    and (dj.delivered_at is null or now() <= dj.delivered_at + interval '2 hours');
end;
$$;

-- ---------- Activer RLS sur TOUTES les tables public ----------
do $$
declare t record;
begin
  for t in
    select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security', t.tablename);
  end loop;
end $$;

-- ---------- Policies ----------

-- Données de référence : lecture pour tout utilisateur authentifié
create policy ref_read_cities       on public.cities       for select to authenticated using (true);
create policy ref_read_zones        on public.zones        for select to authenticated using (true);
create policy ref_read_zone_prices  on public.zone_prices  for select to authenticated using (true);
create policy ref_read_settings     on public.settings     for select to authenticated using (true);

-- Profils
create policy profiles_select_own on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Rôles : lecture de ses propres rôles (ou admin)
create policy user_roles_select on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- Adresses : CRUD complet sur les siennes
create policy addresses_all_own on public.addresses for all to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid());

-- Livreur : lecture de son profil / docs / shifts (ou admin)
create policy courier_profiles_select on public.courier_profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy courier_documents_select on public.courier_documents for select to authenticated
  using (courier_id = auth.uid() or public.is_admin());
create policy courier_shifts_select on public.courier_shifts for select to authenticated
  using (courier_id = auth.uid() or public.is_admin());

-- Restaurants & menu : lecture publique (authentifiée) ; écriture par membres
create policy restaurants_read on public.restaurants for select to authenticated using (true);
create policy restaurants_write on public.restaurants for update to authenticated
  using (public.is_restaurant_member(id)) with check (public.is_restaurant_member(id));

create policy rhours_read  on public.restaurant_hours  for select to authenticated using (true);
create policy rhours_write on public.restaurant_hours  for all to authenticated
  using (public.is_restaurant_member(restaurant_id)) with check (public.is_restaurant_member(restaurant_id));

create policy mcat_read  on public.menu_categories for select to authenticated using (true);
create policy mcat_write on public.menu_categories for all to authenticated
  using (public.is_restaurant_member(restaurant_id)) with check (public.is_restaurant_member(restaurant_id));

create policy mitem_read  on public.menu_items for select to authenticated using (true);
create policy mitem_write on public.menu_items for all to authenticated
  using (public.is_restaurant_member(restaurant_id)) with check (public.is_restaurant_member(restaurant_id));

create policy ogrp_read on public.option_groups for select to authenticated using (true);
create policy opt_read  on public.options for select to authenticated using (true);

-- Membres restaurant : visibles par les membres du même restaurant (ou admin)
create policy rmembers_select on public.restaurant_members for select to authenticated
  using (public.is_restaurant_member(restaurant_id) or public.is_admin());

-- Commandes : client (les siennes), membres du restaurant, admin. Aucune écriture client.
create policy orders_select on public.orders for select to authenticated
  using (
    customer_id = auth.uid()
    or public.is_restaurant_member(restaurant_id)
    or public.is_admin()
  );

create policy order_items_select on public.order_items for select to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id
      and (o.customer_id = auth.uid() or public.is_restaurant_member(o.restaurant_id) or public.is_admin())
  ));

-- Colis : expéditeur et admin. (Le livreur passe par get_job_contact, pas d'accès direct.)
create policy parcels_select on public.parcels for select to authenticated
  using (sender_id = auth.uid() or public.is_admin());

-- Missions : le livreur voit uniquement celles proposées ou attribuées
create policy delivery_jobs_select on public.delivery_jobs for select to authenticated
  using (
    courier_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.job_offers jo
      where jo.job_id = delivery_jobs.id and jo.courier_id = auth.uid()
    )
  );

create policy job_offers_select on public.job_offers for select to authenticated
  using (courier_id = auth.uid() or public.is_admin());

-- Historique de statut : admin, auteur, ou entité visible par le client
create policy status_history_select on public.status_history for select to authenticated
  using (
    public.is_admin()
    or changed_by = auth.uid()
    or (entity_type = 'orders'  and entity_id in (select id from public.orders  where customer_id = auth.uid()))
    or (entity_type = 'parcels' and entity_id in (select id from public.parcels where sender_id = auth.uid()))
  );

-- Argent : finances réservées aux admins finance ; resto_owner voit les paiements de son restaurant.
create policy payments_select on public.payments for select to authenticated
  using (
    public.is_finance_admin()
    or exists (select 1 from public.orders o where o.id = payments.order_id and public.is_restaurant_owner(o.restaurant_id))
  );

create policy ledger_select   on public.ledger_entries  for select to authenticated using (public.is_finance_admin());
create policy pevents_select  on public.payment_events  for select to authenticated using (public.is_finance_admin());
create policy refunds_select  on public.refunds         for select to authenticated using (public.is_finance_admin());

-- Reversements / caisse : admin finance ou le livreur concerné
create policy payouts_select on public.payouts for select to authenticated
  using (public.is_finance_admin() or courier_id = auth.uid());
create policy remit_select on public.cash_remittances for select to authenticated
  using (public.is_finance_admin() or courier_id = auth.uid());

-- Commercial / qualité
create policy promotions_read on public.promotions for select to authenticated using (active);
create policy promo_redemptions_select on public.promo_redemptions for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy referrals_select on public.referrals for select to authenticated
  using (referrer_id = auth.uid() or referred_id = auth.uid() or public.is_admin());

create policy ratings_select on public.ratings for select to authenticated
  using (rater_id = auth.uid() or rated_user_id = auth.uid() or public.is_admin());
create policy ratings_insert on public.ratings for insert to authenticated
  with check (rater_id = auth.uid());

create policy tickets_select on public.tickets for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy tickets_insert on public.tickets for insert to authenticated
  with check (user_id = auth.uid());
create policy ticket_events_select on public.ticket_events for select to authenticated
  using (exists (select 1 from public.tickets t where t.id = ticket_events.ticket_id
                 and (t.user_id = auth.uid() or public.is_admin())));

create policy notifications_select on public.notifications for select to authenticated
  using (user_id = auth.uid());
create policy push_tokens_all on public.push_tokens for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy audit_select on public.admin_audit_logs for select to authenticated using (public.is_admin());

-- Remarque : toute table sans policy d'écriture reste en default-deny pour
-- 'authenticated'. Les écritures sur orders, parcels, payments, ledger_entries,
-- payouts, etc. passent obligatoirement par service_role (Edge Functions).
