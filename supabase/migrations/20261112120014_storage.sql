-- ============================================================
-- Nova Delivery — Migration 14 : Storage (buckets + policies)
-- Convention de chemin : <owner_or_restaurant_id>/<fichier>
-- ============================================================

-- ---------- Buckets ----------
insert into storage.buckets (id, name, public, allowed_mime_types)
values
  ('menu',        'menu',        true,  array['image/webp'])
on conflict (id) do update set public = excluded.public, allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public)
values
  ('courier-docs', 'courier-docs', false),
  ('proofs',       'proofs',       false),
  ('addresses',    'addresses',    false)
on conflict (id) do nothing;

-- ---------- Policies storage.objects ----------

-- menu : lecture publique, écriture par membres du restaurant (dossier = restaurant_id)
create policy menu_public_read on storage.objects for select
  using (bucket_id = 'menu');
create policy menu_member_write on storage.objects for insert to authenticated
  with check (
    bucket_id = 'menu'
    and (public.is_admin() or public.is_restaurant_member(((storage.foldername(name))[1])::uuid))
  );
create policy menu_member_modify on storage.objects for update to authenticated
  using (
    bucket_id = 'menu'
    and (public.is_admin() or public.is_restaurant_member(((storage.foldername(name))[1])::uuid))
  );
create policy menu_member_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'menu'
    and (public.is_admin() or public.is_restaurant_member(((storage.foldername(name))[1])::uuid))
  );

-- courier-docs : lecture admin uniquement ; le livreur dépose ses propres pièces (dossier = courier_id)
create policy courier_docs_admin_read on storage.objects for select to authenticated
  using (bucket_id = 'courier-docs' and public.is_admin());
create policy courier_docs_owner_write on storage.objects for insert to authenticated
  with check (bucket_id = 'courier-docs' and (storage.foldername(name))[1] = auth.uid()::text);

-- proofs : photos de livraison. Lecture admin + déposant ; écriture par le déposant (livreur).
create policy proofs_read on storage.objects for select to authenticated
  using (bucket_id = 'proofs' and (public.is_admin() or owner = auth.uid()));
create policy proofs_write on storage.objects for insert to authenticated
  with check (bucket_id = 'proofs');

-- addresses : photos/audio d'adresse. Lecture propriétaire + admin ; CRUD propriétaire (dossier = user_id).
create policy addresses_obj_read on storage.objects for select to authenticated
  using (bucket_id = 'addresses' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy addresses_obj_write on storage.objects for insert to authenticated
  with check (bucket_id = 'addresses' and (storage.foldername(name))[1] = auth.uid()::text);
create policy addresses_obj_modify on storage.objects for update to authenticated
  using (bucket_id = 'addresses' and (storage.foldername(name))[1] = auth.uid()::text);
create policy addresses_obj_delete on storage.objects for delete to authenticated
  using (bucket_id = 'addresses' and (storage.foldername(name))[1] = auth.uid()::text);
