-- Add loyal fan badge (unique badge for the most dedicated user)
alter table public.profiles
  add column if not exists is_loyal_fan boolean default false;

-- Award to Аліна Бурухіна
update public.profiles
  set is_loyal_fan = true
  where id = 'ecd9ad9e-c288-492d-951b-968f6a45ed3e';

-- Update get_public_profile to include is_loyal_fan
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
    select id, username, avatar_url, xp, streak, is_alpha_tester, is_loyal_fan, created_at
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
