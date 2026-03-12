-- Allow all authenticated users to view profiles for the leaderboard
create policy "Authenticated users can view all profiles"
  on public.profiles for select
  to authenticated
  using (true);

-- Leaderboard RPC — returns top users by XP (SECURITY DEFINER bypasses RLS)
create or replace function get_leaderboard(p_limit int default 100)
returns table (
  id uuid,
  username text,
  avatar_url text,
  xp int,
  streak int
)
language sql
security definer
as $$
  select p.id, p.username, p.avatar_url, p.xp, p.streak
  from public.profiles p
  order by p.xp desc
  limit p_limit;
$$;
