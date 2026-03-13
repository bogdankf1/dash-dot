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

-- Public profile RPC — returns a user's profile + lesson history (SECURITY DEFINER bypasses RLS)
create or replace function get_public_profile(p_user_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  v_profile json;
  v_history json;
  v_letter_progress json;
begin
  select row_to_json(p) into v_profile
  from (
    select id, username, avatar_url, xp, streak, is_alpha_tester, created_at
    from public.profiles
    where id = p_user_id
  ) p;

  if v_profile is null then
    return null;
  end if;

  select coalesce(json_agg(h order by h.completed_at desc), '[]'::json) into v_history
  from (
    select xp_earned, accuracy, completed_at
    from public.lesson_history
    where user_id = p_user_id
  ) h;

  select coalesce(json_agg(lp), '[]'::json) into v_letter_progress
  from (
    select symbol, mastery_level, correct_count, attempt_count
    from public.letter_progress
    where user_id = p_user_id
  ) lp;

  return json_build_object(
    'profile', v_profile,
    'lessonHistory', v_history,
    'letterProgress', v_letter_progress
  );
end;
$$;
