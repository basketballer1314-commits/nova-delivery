-- ============================================================
-- Nova Delivery — Migration 28 : Push notifications (Expo)
-- Trigger pg_net à l'insertion d'une notification (sauf 'sms') → send-push.
-- Paramètres URL/secret stockés en base (settings), jamais dans git.
-- ============================================================
set search_path = public, extensions;

alter table public.notifications
  add column if not exists pushed_at timestamptz;

-- Placeholders : à renseigner après déploiement de la fonction.
insert into settings (key, value) values
  ('push_function_url', '""'),
  ('push_hook_secret',  '""')
on conflict (key) do nothing;

create or replace function public.notify_push()
returns trigger language plpgsql security definer set search_path = public, extensions as $$
declare v_url text; v_secret text;
begin
  if new.type = 'sms' then return new; end if;
  select value #>> '{}' into v_url    from public.settings where key = 'push_function_url';
  select value #>> '{}' into v_secret from public.settings where key = 'push_hook_secret';
  if v_url is null or v_url = '' then return new; end if;
  if not exists (select 1 from public.push_tokens where user_id = new.user_id) then return new; end if;

  perform net.http_post(
    url     := v_url,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-push-secret', coalesce(v_secret, '')),
    body    := jsonb_build_object(
      'notification_id', new.id, 'user_id', new.user_id,
      'title', new.title, 'body', new.body, 'data', new.data)
  );
  return new;
end;
$$;

drop trigger if exists notifications_push on public.notifications;
create trigger notifications_push
  after insert on public.notifications
  for each row execute function public.notify_push();

revoke all on function public.notify_push() from public;
grant execute on function public.notify_push() to service_role;
