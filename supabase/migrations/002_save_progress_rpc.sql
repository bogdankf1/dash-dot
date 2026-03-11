CREATE OR REPLACE FUNCTION save_lesson_progress(
  p_user_id uuid,
  p_chapter_id text,
  p_lesson_id text,
  p_xp_earned int,
  p_accuracy double precision,
  p_symbol_results jsonb,
  p_timezone_offset int DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_local_date date;
  v_last_activity date;
  v_current_streak int;
  v_new_streak int;
  v_elem jsonb;
BEGIN
  -- Compute user's local date from UTC offset (minutes)
  v_local_date := (now() - (p_timezone_offset * interval '1 minute'))::date;

  -- Insert lesson history
  INSERT INTO lesson_history (user_id, chapter_id, lesson_id, xp_earned, accuracy)
  VALUES (p_user_id, p_chapter_id, p_lesson_id, p_xp_earned, p_accuracy);

  -- Upsert letter progress with atomic increments
  FOR v_elem IN SELECT * FROM jsonb_array_elements(p_symbol_results)
  LOOP
    INSERT INTO letter_progress (user_id, symbol, mastery_level, correct_count, attempt_count, last_seen)
    VALUES (
      p_user_id,
      v_elem->>'symbol',
      (v_elem->>'masteryLevel')::int,
      (v_elem->>'correct')::int,
      (v_elem->>'attempts')::int,
      now()
    )
    ON CONFLICT (user_id, symbol) DO UPDATE SET
      mastery_level = (v_elem->>'masteryLevel')::int,
      correct_count = letter_progress.correct_count + (v_elem->>'correct')::int,
      attempt_count = letter_progress.attempt_count + (v_elem->>'attempts')::int,
      last_seen = now();
  END LOOP;

  -- Lock the profile row to prevent concurrent streak/xp races
  SELECT streak, last_activity_date
  INTO v_current_streak, v_last_activity
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  -- Streak logic using local date
  IF v_last_activity = v_local_date THEN
    -- Same day: no streak change
    v_new_streak := v_current_streak;
  ELSIF v_last_activity = v_local_date - 1 THEN
    -- Yesterday: increment streak
    v_new_streak := v_current_streak + 1;
  ELSE
    -- Streak broken or first activity
    v_new_streak := 1;
  END IF;

  -- Atomic XP and streak update
  UPDATE profiles
  SET xp = xp + p_xp_earned,
      streak = v_new_streak,
      last_activity_date = v_local_date
  WHERE id = p_user_id;
END;
$$;
