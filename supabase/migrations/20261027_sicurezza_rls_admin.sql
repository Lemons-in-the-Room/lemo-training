-- =====================================================================
-- lemo-training — Sicurezza tabelle + ruolo admin
-- Progetto Supabase: nzlctxteymrysmvqbquc (org Lemons In The Room)
-- Da applicare SOLO dopo che il nuovo frontend (Welcome.jsx / Admin.jsx)
-- è online, poi nominare il primo admin (sezione 6).
-- =====================================================================

-- 1. Colonna admin -----------------------------------------------------
alter table public.users add column if not exists is_admin boolean not null default false;

-- 2. Funzione: l'utente collegato è admin? (security definer = niente ricorsione RLS)
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce((select u.is_admin from public.users u where u.id = auth.uid()), false);
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- 3. Profilo creato dal database alla registrazione ---------------------
--    I dati arrivano da supabase.auth.signUp({ options: { data: {...} } })
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  m  jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  fn text  := nullif(trim(m->>'first_name'), '');
  ln text  := nullif(trim(m->>'last_name'), '');
  is_demo boolean := (lower(coalesce(fn,'')) = 'mario' and lower(coalesce(ln,'')) = 'rossi')
                     or lower(coalesce(fn,'')) = 'demo';
begin
  insert into public.users (
    id, email, name, first_name, last_name, phone, hospital, department,
    patient_type, mode, login_count, first_login, last_login, completed_modules
  ) values (
    new.id, new.email,
    coalesce(nullif(trim(concat_ws(' ', fn, ln)), ''), new.email),
    fn, ln,
    nullif(m->>'phone', ''), nullif(m->>'hospital', ''), nullif(m->>'department', ''),
    nullif(m->>'patient_type', ''), nullif(m->>'mode', ''),
    1, now(), now(),
    case when is_demo then array[1,2,3,4] else '{}'::int[] end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. Guardia sugli aggiornamenti --------------------------------------
--    - solo un admin può cambiare is_admin o l'email di un profilo
--    - non si può togliere / cancellare l'ultimo admin
create or replace function public.guard_users_change()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  via_api boolean := coalesce(auth.role(), '') in ('authenticated', 'anon');
begin
  if tg_op = 'UPDATE' then
    if new.id <> old.id then
      raise exception 'Modifica non consentita (id).';
    end if;
    if via_api and not public.is_admin()
       and (new.is_admin is distinct from old.is_admin or new.email is distinct from old.email) then
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
$$;

drop trigger if exists guard_users_change on public.users;
create trigger guard_users_change
  before update or delete on public.users
  for each row execute function public.guard_users_change();

-- 5. Regole di accesso (RLS) -------------------------------------------
alter table public.users      enable row level security;
alter table public.newsletter enable row level security;

drop policy if exists "Public access"            on public.users;
drop policy if exists "Public access newsletter" on public.newsletter;

-- users: ognuno vede/modifica la propria riga; gli admin tutto
create policy users_select on public.users
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

create policy users_insert_own on public.users
  for insert to authenticated
  with check (id = auth.uid() and is_admin = false);

create policy users_update on public.users
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

create policy users_delete_admin on public.users
  for delete to authenticated
  using (public.is_admin());

-- newsletter: ci si iscrive solo con la propria email; la lista la vedono solo gli admin
create policy newsletter_select on public.newsletter
  for select to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email') or public.is_admin());

create policy newsletter_insert_own on public.newsletter
  for insert to authenticated
  with check (lower(email) = lower(auth.jwt() ->> 'email'));

create policy newsletter_update_own on public.newsletter
  for update to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email'))
  with check (lower(email) = lower(auth.jwt() ->> 'email'));

create policy newsletter_delete_admin on public.newsletter
  for delete to authenticated
  using (public.is_admin());

-- 6. Profili mancanti (account di login senza riga in users) -----------
insert into public.users (id, email, name, login_count, first_login, last_login, completed_modules)
select a.id, a.email, a.email, 0, a.created_at, coalesce(a.last_sign_in_at, a.created_at), '{}'::int[]
from auth.users a
left join public.users u on u.id = a.id
where u.id is null and a.email is not null
on conflict do nothing;

-- 7. Primo admin (eseguire a parte, con l'email scelta da Leonardo) ----
-- update public.users set is_admin = true where lower(email) = lower('<EMAIL>');
