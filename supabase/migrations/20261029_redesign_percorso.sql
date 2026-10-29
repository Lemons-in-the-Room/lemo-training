-- =====================================================================
-- lemo-training — Redesign: verifica finale, primo accesso, elenchi
-- Progetto Supabase: nzlctxteymrysmvqbquc
-- Ogni blocco è indipendente e va approvato da Leonardo.
-- =====================================================================

-- 1. Verifica finale ---------------------------------------------------
--    data in cui l'operatore ha superato la verifica finale (null = non ancora)
alter table public.users add column if not exists final_quiz_passed_at timestamptz;
alter table public.users add column if not exists final_quiz_best_score smallint;

--    chi aveva già completato tutti i moduli col sistema vecchio resta certificato
update public.users u
set final_quiz_passed_at = coalesce(u.last_login, now())
where u.final_quiz_passed_at is null
  and (
    (coalesce(u.patient_type, 'adulti') <> 'pediatria' and u.completed_modules @> array[1,2,3,4,5,9])
    or (u.patient_type = 'pediatria' and u.completed_modules @> array[10,11,12,4,6,13,7,8,5])
  );

-- 2. Domande del primo accesso -----------------------------------------
--    onboarding_answered_at null  = le domande vanno ancora fatte
--    prior_onboarding             = "Hai già fatto un onboarding con il team Lemons?"
--    uses_tablet                  = "Nel tuo reparto usate il visore con il tablet?" (modificabile)
alter table public.users add column if not exists onboarding_answered_at timestamptz;
alter table public.users add column if not exists prior_onboarding boolean;
alter table public.users add column if not exists uses_tablet boolean not null default false;

-- 3. Elenchi di ospedali e reparti -------------------------------------
--    approved = true  -> compare nell'elenco della registrazione
--    approved = false -> scritto a mano da un operatore ("Altro"), da approvare in Admin
create table if not exists public.catalog_options (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null check (kind in ('hospital', 'department')),
  name        text not null check (length(trim(name)) between 2 and 120),
  approved    boolean not null default false,
  sort        int not null default 100,
  created_at  timestamptz not null default now()
);
create unique index if not exists catalog_options_kind_name on public.catalog_options (kind, lower(trim(name)));

alter table public.catalog_options enable row level security;

drop policy if exists catalog_read on public.catalog_options;
drop policy if exists catalog_read_anon on public.catalog_options;
create policy catalog_read_anon on public.catalog_options
  for select to anon
  using (approved);
drop policy if exists catalog_read_auth on public.catalog_options;
create policy catalog_read_auth on public.catalog_options
  for select to authenticated
  using (approved or public.is_admin());

drop policy if exists catalog_admin_write on public.catalog_options;
create policy catalog_admin_write on public.catalog_options
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

--    le voci scritte a mano in registrazione entrano da sole come "da approvare"
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

  if hosp is not null then
    insert into public.catalog_options (kind, name, approved) values ('hospital', hosp, false)
    on conflict do nothing;
  end if;
  if dep is not null then
    insert into public.catalog_options (kind, name, approved) values ('department', dep, false)
    on conflict do nothing;
  end if;
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

--    ospedali clienti (dalla Dashboard Headsets) + quelli già presenti tra gli utenti
insert into public.catalog_options (kind, name, approved, sort) values
  ('hospital', 'AOU Careggi', true, 100),
  ('hospital', 'AOU Pisana', true, 100),
  ('hospital', 'AOU Senese', true, 100),
  ('hospital', 'Arcispedale S. Maria Nuova (Reggio Emilia)', true, 100),
  ('hospital', 'ASL Frosinone - Ospedale F. Spaziani', true, 100),
  ('hospital', 'ASL Toscana Sud Est', true, 100),
  ('hospital', 'Casa AIL', true, 100),
  ('hospital', 'IRCCS Candiolo', true, 100),
  ('hospital', 'IRCCS Meyer', true, 100),
  ('hospital', 'IRCCS Policlinico San Martino, Genova', true, 100),
  ('hospital', 'La Casina dei Bambini ODV', true, 100),
  ('hospital', 'Ospedale Infantile Regina Margherita', true, 100),
  ('hospital', 'Ospedale Santa Maria Annunziata', true, 100),
  ('hospital', 'Ospedale Santo Stefano', true, 100)
on conflict do nothing;

--    reparti ospedalieri
insert into public.catalog_options (kind, name, approved)
select 'department', d, true from unnest(array[
  'Ambulatorio',
  'Anestesia e Rianimazione',
  'Blocco operatorio',
  'Cardiologia',
  'Centro prelievi',
  'Chirurgia generale',
  'Chirurgia pediatrica',
  'Cure palliative / Hospice',
  'Day Hospital',
  'Day Hospital oncologico',
  'Day Surgery',
  'Dermatologia',
  'Diagnostica per immagini / Radiologia',
  'Dialisi',
  'Ematologia',
  'Endoscopia',
  'Gastroenterologia',
  'Geriatria',
  'Ginecologia e Ostetricia',
  'Lungodegenza',
  'Malattie infettive',
  'Medicina generale / interna',
  'Medicina nucleare',
  'Nefrologia',
  'Neonatologia / TIN',
  'Neurochirurgia',
  'Neurologia',
  'Neuropsichiatria infantile',
  'Oculistica',
  'Odontoiatria',
  'Oncoematologia pediatrica',
  'Oncologia',
  'Ortopedia',
  'Ortopedia pediatrica',
  'Otorinolaringoiatria',
  'Pediatria',
  'Pneumologia',
  'Poliambulatorio',
  'Pronto Soccorso / DEA',
  'Pronto Soccorso pediatrico',
  'Psichiatria',
  'Psicologia',
  'Radioterapia',
  'Reumatologia',
  'Riabilitazione',
  'Senologia',
  'Terapia del dolore',
  'Terapia intensiva',
  'Terapia intensiva pediatrica',
  'Urologia'
]) as d
on conflict do nothing;
