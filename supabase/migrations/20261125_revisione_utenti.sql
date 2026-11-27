-- Revisione dei nuovi utenti da parte del team (scheda "Da revisionare" della dashboard).
-- reviewed_at vuoto = da revisionare. Tutti gli utenti esistenti partono da revisionare.
alter table public.users
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null;

-- Solo un admin può segnare (o togliere) la revisione: l'operatore non può farlo sul proprio profilo.
create or replace function public.guard_users_change()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  via_api boolean := coalesce(auth.role(), '') in ('authenticated', 'anon');
begin
  if tg_op = 'UPDATE' then
    if new.id <> old.id then
      raise exception 'Modifica non consentita (id).';
    end if;
    if via_api and not public.is_admin()
       and (new.is_admin is distinct from old.is_admin
            or new.email is distinct from old.email
            or new.reviewed_at is distinct from old.reviewed_at
            or new.reviewed_by is distinct from old.reviewed_by) then
      raise exception 'Modifica non consentita: serve un admin.';
    end if;
    if old.is_admin and not new.is_admin
       and (select count(*) from public.users where is_admin) <= 1 then
      raise exception 'Non puoi rimuovere l''ultimo admin.';
    end if;
    return new;
  elsif tg_op = 'DELETE' then
    if old.is_admin and (select count(*) from public.users where is_admin) <= 1 then
      raise exception 'Non puoi eliminare l''ultimo admin.';
    end if;
    return old;
  end if;
  return null;
end;
$function$;
