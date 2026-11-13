-- ============================================================
-- Nova Delivery — Migration 21 : RPC publique de suivi colis
-- Expose UNIQUEMENT des champs limités, via le tracking_token secret.
-- Jamais le code de remise. Lien expiré 24 h après livraison.
-- ============================================================
set search_path = public, extensions;

create or replace function public.track_parcel(_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  p            record;
  job          record;
  courier_name text;
  pos_lat      double precision;
  pos_lng      double precision;
  pay          integer;
begin
  select id, status, recipient_name, cod_amount, price, payment_method
    into p
    from public.parcels
   where tracking_token = _token;

  if not found then
    return jsonb_build_object('found', false);
  end if;

  -- Dernière mission liée au colis.
  select dj.courier_id, dj.delivered_at
    into job
    from public.delivery_jobs dj
   where dj.parcel_id = p.id
   order by dj.created_at desc
   limit 1;

  -- Lien expiré 24 h après livraison.
  if job.delivered_at is not null and now() > job.delivered_at + interval '24 hours' then
    return jsonb_build_object('found', true, 'expired', true);
  end if;

  -- Prénom + position du livreur (si assigné).
  if job.courier_id is not null then
    select split_part(coalesce(pr.full_name, ''), ' ', 1),
           ST_Y(cp.last_location::geometry),
           ST_X(cp.last_location::geometry)
      into courier_name, pos_lat, pos_lng
      from public.courier_profiles cp
      join public.profiles pr on pr.id = cp.id
     where cp.id = job.courier_id;
  end if;

  -- Montant à payer : contre-remboursement, sinon prix si paiement espèces.
  pay := case
    when p.cod_amount > 0 then p.cod_amount
    when p.payment_method = 'cash' then p.price
    else 0
  end;

  return jsonb_build_object(
    'found', true,
    'expired', false,
    'status', p.status,
    'recipient_name', p.recipient_name,
    'courier_first_name', courier_name,
    'courier_lat', pos_lat,
    'courier_lng', pos_lng,
    'amount_to_pay', pay
  );
end;
$$;

-- Page publique : accessible sans authentification.
grant execute on function public.track_parcel(text) to anon, authenticated;
