-- Testi della piattaforma modificabili dalla dashboard, con traduzioni EN/ES generate (Gemini) e correggibili.
-- L'italiano è la fonte. Stato di ogni traduzione: 'ok' (verificata o corretta a mano) / 'review' (generata, da ricontrollare).

-- BLOCCO 1: tabella e permessi
create table if not exists public.content_strings (
  key        text primary key,                 -- es. 'lang.modules.lessons.0.title' o 'ui.home.start'
  section    text not null,                    -- raggruppamento nella scheda Contenuti (es. 'Modulo 1 · Introduzione')
  it         text not null,
  en         text,
  es         text,
  en_status  text not null default 'ok' check (en_status in ('ok','review')),
  es_status  text not null default 'ok' check (es_status in ('ok','review')),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);
create index if not exists content_strings_updated_at on public.content_strings (updated_at);
alter table public.content_strings enable row level security;
-- lettura per tutti (i testi servono anche prima del login), modifica solo admin
create policy content_read on public.content_strings for select to anon, authenticated using (true);
create policy content_write on public.content_strings for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- BLOCCO 2: caricamento dei testi attuali (generato da .design/tmp/seed_testi.mjs, stato 'ok')
-- insert into public.content_strings (key, section, it, en, es, updated_at) values ... on conflict (key) do nothing;
