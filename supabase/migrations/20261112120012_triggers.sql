-- ============================================================
-- Nova Delivery — Migration 12 : Triggers transverses
-- (toutes les tables existent à ce stade)
-- ============================================================

-- updated_at : attaché automatiquement à toute table public ayant la colonne
do $$
declare
  t record;
begin
  for t in
    select table_name
      from information_schema.columns
     where table_schema = 'public'
       and column_name = 'updated_at'
  loop
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at()',
      t.table_name
    );
  end loop;
end $$;

-- status_history : à chaque changement de statut de orders, parcels, delivery_jobs
create trigger record_status
  after insert or update of status on public.orders
  for each row execute function public.record_status_change();

create trigger record_status
  after insert or update of status on public.parcels
  for each row execute function public.record_status_change();

create trigger record_status
  after insert or update of status on public.delivery_jobs
  for each row execute function public.record_status_change();
