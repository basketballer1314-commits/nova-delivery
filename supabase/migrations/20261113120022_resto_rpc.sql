-- ============================================================
-- Nova Delivery — Migration 22 : RPC espace restaurant (/resto)
-- Toutes les actions resto passent par ces fonctions SECURITY DEFINER,
-- qui vérifient l'appartenance (is_restaurant_member / owner) côté serveur.
-- auth.uid() reste l'utilisateur appelant → status_history garde l'auteur.
-- ============================================================
set search_path = public, extensions;

-- ---------- Colonnes additionnelles ----------
alter table public.restaurants
  add column if not exists paused_until         timestamptz,
  add column if not exists consecutive_refusals integer not null default 0
    check (consecutive_refusals >= 0);

alter table public.orders
  add column if not exists prep_minutes   integer check (prep_minutes >= 0),
  add column if not exists refusal_reason text
    check (refusal_reason in ('rupture', 'fermeture', 'trop_de_commandes', 'non_reponse'));

-- RG-18 : seuil de refus/non-réponses consécutifs et durée de pause.
-- (durée choisie : 1 h, cohérente avec la pause manuelle « Fermé 1 h ».)
create or replace function public.resto_rg18_threshold() returns integer
  language sql immutable as $$ select 3 $$;

-- ---------- Restaurants de l'utilisateur (owner + staff) ----------
create or replace function public.resto_my_restaurants()
returns table (
  id            uuid,
  name          text,
  slug          text,
  status        restaurant_status,
  paused_until  timestamptz,
  is_owner      boolean
)
language sql stable security definer set search_path = public as $$
  select r.id, r.name, r.slug, r.status, r.paused_until,
         (r.owner_id = auth.uid()) as is_owner
  from public.restaurants r
  where public.is_restaurant_member(r.id)
  order by r.name;
$$;

-- ---------- File des commandes (nouvelles + en préparation + prêtes) ----------
create or replace function public.resto_queue(_restaurant_id uuid)
returns table (
  id             uuid,
  status         order_status,
  total          integer,
  prep_minutes   integer,
  created_at     timestamptz,
  items          jsonb
)
language sql stable security definer set search_path = public as $$
  select
    o.id, o.status, o.total, o.prep_minutes, o.created_at,
    coalesce(
      (select jsonb_agg(jsonb_build_object(
          'name', oi.name_snapshot,
          'quantity', oi.quantity,
          'options', oi.options_snapshot,
          'line_total', oi.line_total) order by oi.created_at)
       from public.order_items oi where oi.order_id = o.id),
      '[]'::jsonb
    ) as items
  from public.orders o
  where o.restaurant_id = _restaurant_id
    and public.is_restaurant_member(_restaurant_id)
    and o.status in ('ENVOYEE_RESTAURANT', 'ACCEPTEE', 'PRETE', 'RECHERCHE_LIVREUR')
  order by o.created_at;
$$;

-- ---------- RG-18 : pause auto + ticket commercial ----------
create or replace function public.resto_apply_rg18(_restaurant_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_count integer;
  v_owner uuid;
  v_name  text;
begin
  update public.restaurants
     set consecutive_refusals = consecutive_refusals + 1
   where id = _restaurant_id
  returning consecutive_refusals, owner_id, name into v_count, v_owner, v_name;

  if v_count >= public.resto_rg18_threshold() then
    update public.restaurants
       set paused_until = now() + interval '1 hour',
           consecutive_refusals = 0
     where id = _restaurant_id;

    if v_owner is not null then
      insert into public.tickets (user_id, subject, status, priority)
      values (v_owner,
              format('RG-18 : %s en pause (3 refus/non-réponses consécutifs)', v_name),
              'OUVERT', 'HAUTE');
    end if;
  end if;
end;
$$;

-- ---------- Accepter une commande (temps de préparation) ----------
create or replace function public.resto_accept_order(_order_id uuid, _prep_minutes integer)
returns void
language plpgsql security definer set search_path = public as $$
declare v_rid uuid;
begin
  if _prep_minutes is null or _prep_minutes <= 0 or _prep_minutes > 240 then
    raise exception 'temps de préparation invalide';
  end if;

  select restaurant_id into v_rid from public.orders
   where id = _order_id and status = 'ENVOYEE_RESTAURANT' for update;
  if v_rid is null then raise exception 'commande introuvable ou déjà traitée'; end if;
  if not public.is_restaurant_member(v_rid) then raise exception 'non autorisé'; end if;

  update public.orders
     set status = 'ACCEPTEE', prep_minutes = _prep_minutes
   where id = _order_id;

  update public.restaurants set consecutive_refusals = 0 where id = v_rid;
end;
$$;

-- ---------- Refuser une commande (motif obligatoire) ----------
create or replace function public.resto_refuse_order(_order_id uuid, _reason text)
returns void
language plpgsql security definer set search_path = public as $$
declare v_rid uuid;
begin
  if _reason not in ('rupture', 'fermeture', 'trop_de_commandes') then
    raise exception 'motif de refus invalide';
  end if;

  select restaurant_id into v_rid from public.orders
   where id = _order_id and status = 'ENVOYEE_RESTAURANT' for update;
  if v_rid is null then raise exception 'commande introuvable ou déjà traitée'; end if;
  if not public.is_restaurant_member(v_rid) then raise exception 'non autorisé'; end if;

  update public.orders
     set status = 'REFUSEE', refusal_reason = _reason
   where id = _order_id;

  perform public.resto_apply_rg18(v_rid);
end;
$$;

-- ---------- Non-réponse (>3 min sans action) → RG-18 ----------
create or replace function public.resto_timeout_order(_order_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare v_rid uuid; v_created timestamptz;
begin
  select restaurant_id, created_at into v_rid, v_created from public.orders
   where id = _order_id and status = 'ENVOYEE_RESTAURANT' for update;
  if v_rid is null then raise exception 'commande introuvable ou déjà traitée'; end if;
  if not public.is_restaurant_member(v_rid) then raise exception 'non autorisé'; end if;
  if now() < v_created + interval '3 minutes' then
    raise exception 'délai de réponse non écoulé';
  end if;

  update public.orders
     set status = 'REFUSEE', refusal_reason = 'non_reponse'
   where id = _order_id;

  perform public.resto_apply_rg18(v_rid);
end;
$$;

-- ---------- Commande prête ----------
create or replace function public.resto_order_ready(_order_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare v_rid uuid;
begin
  select restaurant_id into v_rid from public.orders
   where id = _order_id and status = 'ACCEPTEE' for update;
  if v_rid is null then raise exception 'commande introuvable ou non acceptée'; end if;
  if not public.is_restaurant_member(v_rid) then raise exception 'non autorisé'; end if;

  update public.orders set status = 'PRETE' where id = _order_id;
end;
$$;

-- ---------- Pause temporaire / réouverture ----------
-- _minutes null → réouvre ; sinon pause pour _minutes.
create or replace function public.resto_set_pause(_restaurant_id uuid, _minutes integer)
returns timestamptz
language plpgsql security definer set search_path = public as $$
declare v_until timestamptz;
begin
  if not public.is_restaurant_member(_restaurant_id) then raise exception 'non autorisé'; end if;
  if _minutes is null then
    v_until := null;
  else
    if _minutes <= 0 or _minutes > 1440 then raise exception 'durée de pause invalide'; end if;
    v_until := now() + make_interval(mins => _minutes);
  end if;
  update public.restaurants set paused_until = v_until where id = _restaurant_id;
  return v_until;
end;
$$;

-- ---------- Disponibilité d'un plat en un geste ----------
create or replace function public.resto_toggle_item(_item_id uuid, _available boolean)
returns void
language plpgsql security definer set search_path = public as $$
declare v_rid uuid;
begin
  select restaurant_id into v_rid from public.menu_items where id = _item_id;
  if v_rid is null then raise exception 'plat introuvable'; end if;
  if not public.is_restaurant_member(v_rid) then raise exception 'non autorisé'; end if;
  update public.menu_items set available = _available where id = _item_id;
end;
$$;

-- ---------- Employés (owner uniquement) ----------
create or replace function public.resto_list_staff(_restaurant_id uuid)
returns table (user_id uuid, full_name text, phone text, member_role app_role, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select m.user_id, p.full_name, p.phone, m.member_role, m.created_at
  from public.restaurant_members m
  join public.profiles p on p.id = m.user_id
  where m.restaurant_id = _restaurant_id
    and public.is_restaurant_owner(_restaurant_id)
  order by m.created_at;
$$;

create or replace function public.resto_add_staff(_restaurant_id uuid, _phone text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare v_uid uuid;
begin
  if not public.is_restaurant_owner(_restaurant_id) then raise exception 'réservé au propriétaire'; end if;
  if _phone !~ '^\+[0-9]{8,15}$' then raise exception 'téléphone invalide (format +221…)'; end if;

  select id into v_uid from public.profiles where phone = _phone;
  if v_uid is null then raise exception 'aucun compte avec ce numéro'; end if;

  insert into public.restaurant_members (restaurant_id, user_id, member_role)
  values (_restaurant_id, v_uid, 'resto_staff')
  on conflict (restaurant_id, user_id) do nothing;

  insert into public.user_roles (user_id, role, restaurant_id)
  values (v_uid, 'resto_staff', _restaurant_id)
  on conflict (user_id, role, restaurant_id) do nothing;

  return v_uid;
end;
$$;

create or replace function public.resto_remove_staff(_restaurant_id uuid, _user_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_restaurant_owner(_restaurant_id) then raise exception 'réservé au propriétaire'; end if;
  if _user_id = (select owner_id from public.restaurants where id = _restaurant_id) then
    raise exception 'impossible de retirer le propriétaire';
  end if;
  delete from public.restaurant_members where restaurant_id = _restaurant_id and user_id = _user_id;
  delete from public.user_roles
   where restaurant_id = _restaurant_id and user_id = _user_id and role = 'resto_staff';
end;
$$;

-- ---------- Historique des commandes ----------
create or replace function public.resto_history(_restaurant_id uuid, _limit integer default 100)
returns table (
  id uuid, status order_status, total integer, refusal_reason text,
  prep_minutes integer, created_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select o.id, o.status, o.total, o.refusal_reason, o.prep_minutes, o.created_at
  from public.orders o
  where o.restaurant_id = _restaurant_id
    and public.is_restaurant_member(_restaurant_id)
    and o.status in ('LIVREE','TERMINEE','REFUSEE','ANNULEE','ECHEC')
  order by o.created_at desc
  limit greatest(1, least(coalesce(_limit, 100), 500));
$$;

-- ---------- Relevés (owner uniquement) : ventes, commission, reversement ----------
create or replace function public.resto_reports(_restaurant_id uuid, _from timestamptz, _to timestamptz)
returns table (
  orders_count     bigint,
  gross_sales      bigint,  -- Σ articles (base reversement)
  commission_total bigint,  -- commission plateforme
  resto_payout     bigint   -- reversement dû au restaurant
)
language sql stable security definer set search_path = public as $$
  select
    count(*)::bigint,
    coalesce(sum(o.items_total), 0)::bigint,
    coalesce(sum((o.pricing_snapshot->>'commission')::integer), 0)::bigint,
    coalesce(sum((o.pricing_snapshot->>'restoPayout')::integer), 0)::bigint
  from public.orders o
  where o.restaurant_id = _restaurant_id
    and public.is_restaurant_owner(_restaurant_id)
    and o.status in ('LIVREE','TERMINEE')
    and o.created_at >= _from and o.created_at < _to;
$$;
