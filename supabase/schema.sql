-- Project Rebirth: run once in the Supabase SQL Editor.
-- One row per document: "settings" plus one "d-YYYY-MM-DD" row per day.
create table public.logs (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

alter table public.logs enable row level security;

-- Each signed-in user can only see and change their own rows.
create policy "own rows only" on public.logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
