-- lemo-training — Elenchi ufficiali degli ospedali (approvato da Leonardo, 29/10/2026)
-- Gli ospedali ufficiali (Italia: Ministero della Salute 2023; Spagna: Catálogo Nacional de Hospitales 2025)
-- stanno in public/ospedali.json (generato da .design/tmp/osp/build_ospedali.py), non nel database.
-- In catalog_options restano solo le voci di Lemons (associazioni, ecc.) e i nomi scritti a mano.

-- 1. tra i "da approvare" finiscono solo i nomi scritti a mano ("Non lo trovo, usa...")
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  m  jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  fn text  := nullif(trim(m->>'first_name'), '');
  ln text  := nullif(trim(m->>'last_name'), '');
  hosp text := nullif(trim(m->>'hospital'), '');
  dep  text := nullif(trim(m->>'department'), '');
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
    nullif(m->>'phone', ''), hosp, dep,
    nullif(m->>'patient_type', ''), nullif(m->>'mode', ''),
    1, now(), now(),
    case when is_demo then array[1,2,3,4] else '{}'::int[] end
  )
  on conflict (id) do nothing;
  if hosp is not null and lower(coalesce(m->>'hospital_custom', '')) = 'true' then
    insert into public.catalog_options (kind, name, approved) values ('hospital', hosp, false) on conflict do nothing;
  end if;
  if dep is not null and lower(coalesce(m->>'department_custom', '')) = 'true' then
    insert into public.catalog_options (kind, name, approved) values ('department', dep, false) on conflict do nothing;
  end if;
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- 2. tolti i doppioni dell'elenco ufficiale caricati a mano il 29/10
delete from public.catalog_options
where kind = 'hospital' and name in (
  'AOU Careggi','AOU Pisana','AOU Senese','Arcispedale S. Maria Nuova (Reggio Emilia)',
  'ASL Frosinone - Ospedale F. Spaziani','IRCCS Candiolo','IRCCS Meyer','IRCCS Policlinico San Martino, Genova',
  'Ospedale Infantile Regina Margherita','Ospedale Santa Maria Annunziata','Ospedale Santo Stefano'
);
