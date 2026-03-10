-- Users (managed by Supabase Auth, extended here)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text,
  avatar_url text,
  xp integer default 0,
  streak integer default 0,
  last_activity_date date,
  selected_guide text default 'google',
  created_at timestamp with time zone default now()
);

-- Letter mastery per user
create table public.letter_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  symbol text not null,
  mastery_level integer default 0,
  correct_count integer default 0,
  attempt_count integer default 0,
  last_seen timestamp with time zone,
  unique(user_id, symbol)
);

-- Completed lessons log
create table public.lesson_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  chapter_id text not null,
  lesson_id text not null,
  xp_earned integer default 0,
  accuracy numeric,
  completed_at timestamp with time zone default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.letter_progress enable row level security;
alter table public.lesson_history enable row level security;

create policy "Users can view/edit own profile"
  on public.profiles for all using (auth.uid() = id);

create policy "Users can view/edit own progress"
  on public.letter_progress for all using (auth.uid() = user_id);

create policy "Users can view/insert own history"
  on public.lesson_history for all using (auth.uid() = user_id);
