-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> Run
create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null default '',
  lang text,
  rows jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists stories_user_updated on public.stories (user_id, updated_at desc);

alter table public.stories enable row level security;

create policy "stories_select_own" on public.stories for select to authenticated using (auth.uid() = user_id);
create policy "stories_insert_own" on public.stories for insert to authenticated with check (auth.uid() = user_id);
create policy "stories_update_own" on public.stories for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "stories_delete_own" on public.stories for delete to authenticated using (auth.uid() = user_id);
