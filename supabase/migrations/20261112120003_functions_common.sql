-- ============================================================
-- Nova Delivery — Migration 03 : Fonctions communes
-- (plpgsql : les références de tables sont résolues au runtime,
--  donc ces fonctions peuvent être créées avant les tables)
-- ============================================================

-- Met à jour updated_at à chaque UPDATE
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Écrit une ligne dans status_history à chaque changement de statut
-- (attaché à orders, parcels, delivery_jobs en migration 12)
create or replace function public.record_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.status is not distinct from old.status then
    return new;
  end if;

  insert into public.status_history (entity_type, entity_id, from_status, to_status, changed_by)
  values (
    tg_table_name,
    new.id,
    case when tg_op = 'UPDATE' then old.status::text else null end,
    new.status::text,
    auth.uid()
  );
  return new;
end;
$$;

-- Crée le profil à l'inscription (trigger sur auth.users, attaché en migration 05)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, phone, full_name)
  values (
    new.id,
    new.phone,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Garantit la partie double : Σdébit = Σcrédit par transaction_id
-- (attaché en migration 10 comme constraint trigger DEFERRABLE INITIALLY DEFERRED)
create or replace function public.assert_ledger_balanced()
returns trigger
language plpgsql
as $$
declare
  tx uuid;
  total_debit bigint;
  total_credit bigint;
begin
  tx := coalesce(new.transaction_id, old.transaction_id);

  select coalesce(sum(debit), 0), coalesce(sum(credit), 0)
    into total_debit, total_credit
    from public.ledger_entries
   where transaction_id = tx;

  if total_debit <> total_credit then
    raise exception 'Grand livre non équilibré pour transaction % : débit=% crédit=%',
      tx, total_debit, total_credit;
  end if;

  return null;
end;
$$;
