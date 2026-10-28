-- =====================================================================
-- lemo-training — Chatbot: base di conoscenza + registro domande
-- Tabelle nuove, additive: si possono applicare prima del deploy.
-- =====================================================================

-- 1. Base di conoscenza (scritta in italiano, gestita dagli admin dal pannello)
create table if not exists public.kb_entries (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  content     text not null,
  tags        text[] not null default '{}',
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users(id) on delete set null
);

create or replace function public.kb_touch()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  return new;
end $$;

drop trigger if exists kb_touch on public.kb_entries;
create trigger kb_touch before insert or update on public.kb_entries
  for each row execute function public.kb_touch();

alter table public.kb_entries enable row level security;

-- leggono tutti gli utenti loggati (il chatbot gira con il token dell'utente)
create policy kb_select on public.kb_entries
  for select to authenticated using (active or public.is_admin());
create policy kb_insert_admin on public.kb_entries
  for insert to authenticated with check (public.is_admin());
create policy kb_update_admin on public.kb_entries
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy kb_delete_admin on public.kb_entries
  for delete to authenticated using (public.is_admin());

-- "versione" della base di conoscenza: cambia solo quando un admin salva/elimina
create or replace function public.kb_version()
returns text language sql stable security definer set search_path = public as $$
  select coalesce(max(updated_at)::text, '0') || ':' || count(*)::text from public.kb_entries;
$$;
revoke all on function public.kb_version() from public, anon;
grant execute on function public.kb_version() to authenticated;

-- 2. Registro domande al chatbot (per il pannello admin e il limite messaggi)
create table if not exists public.chat_logs (
  id          bigint generated always as identity primary key,
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  lang        text,
  question    text not null,
  answer      text,
  sources     text[] not null default '{}',
  answered    boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists chat_logs_user_time on public.chat_logs (user_id, created_at desc);

alter table public.chat_logs enable row level security;

create policy chat_logs_insert_own on public.chat_logs
  for insert to authenticated with check (user_id = auth.uid());
create policy chat_logs_select on public.chat_logs
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy chat_logs_delete_admin on public.chat_logs
  for delete to authenticated using (public.is_admin());

-- 3. Le funzioni-trigger non devono essere richiamabili via API
revoke execute on function public.guard_users_change() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.kb_touch() from public, anon, authenticated;
