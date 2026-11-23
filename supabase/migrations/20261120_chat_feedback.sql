-- Correzioni del team alle risposte del chatbot.
-- Solo gli account @lemonsintheroom.com possono inviarle; solo gli admin le leggono e le gestiscono.
create table if not exists public.chat_feedback (
  id           bigint generated always as identity primary key,
  created_at   timestamptz not null default now(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  chat_log_id  bigint references public.chat_logs(id) on delete set null,
  question     text not null,
  bot_answer   text,
  verdict      text not null check (verdict in ('ok', 'wrong')),
  correction   text,
  status       text not null default 'new' check (status in ('new', 'done', 'discarded')),
  kb_entry_id  uuid references public.kb_entries(id) on delete set null,
  reviewed_at  timestamptz
);
create index if not exists chat_feedback_status on public.chat_feedback (status, created_at desc);

alter table public.chat_feedback enable row level security;

create policy chat_feedback_insert_team on public.chat_feedback
  for insert to authenticated
  with check (user_id = auth.uid() and lower(coalesce(auth.jwt() ->> 'email', '')) like '%@lemonsintheroom.com');
create policy chat_feedback_select_admin on public.chat_feedback
  for select to authenticated using (public.is_admin());
create policy chat_feedback_update_admin on public.chat_feedback
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy chat_feedback_delete_admin on public.chat_feedback
  for delete to authenticated using (public.is_admin());
