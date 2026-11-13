-- ============================================================
-- Nova Delivery — Migration 23 : Realtime sur orders (file /resto)
-- L'espace restaurant s'abonne aux changements de orders (filtrés par
-- restaurant_id). La RLS orders_select s'applique aux diffusions Realtime :
-- un membre ne reçoit que les commandes de son restaurant.
-- ============================================================

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.orders;
    exception
      when duplicate_object then null;
    end;
  end if;
end $$;
