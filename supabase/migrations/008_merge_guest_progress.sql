-- Merge a guest's local snapshot into the authenticated user's rows.
-- Strategy: GREATEST per-field (avoids double-counting if the user already
-- had progress on another device); append all guest lesson_history events.

CREATE OR REPLACE FUNCTION merge_guest_progress(
  p_user_id uuid,
  p_profile jsonb,
  p_letter_progress jsonb,
  p_lesson_history jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_elem jsonb;
  v_local_xp int;
  v_local_streak int;
  v_local_date date;
BEGIN
  -- Profile: take the greater of each field.
  v_local_xp := COALESCE((p_profile->>'xp')::int, 0);
  v_local_streak := COALESCE((p_profile->>'streak')::int, 0);
  v_local_date := NULLIF(p_profile->>'last_activity_date', '')::date;

  UPDATE profiles
  SET
    xp = GREATEST(COALESCE(xp, 0), v_local_xp),
    streak = GREATEST(COALESCE(streak, 0), v_local_streak),
    last_activity_date = GREATEST(last_activity_date, v_local_date)
  WHERE id = p_user_id;

  -- Letter progress: upsert with GREATEST on counts and mastery.
  FOR v_elem IN SELECT * FROM jsonb_array_elements(p_letter_progress)
  LOOP
    INSERT INTO letter_progress (
      user_id, symbol, mastery_level, correct_count, attempt_count, last_seen
    )
    VALUES (
      p_user_id,
      v_elem->>'symbol',
      COALESCE((v_elem->>'mastery_level')::int, 0),
      COALESCE((v_elem->>'correct_count')::int, 0),
      COALESCE((v_elem->>'attempt_count')::int, 0),
      COALESCE((v_elem->>'last_seen')::timestamptz, now())
    )
    ON CONFLICT (user_id, symbol) DO UPDATE SET
      mastery_level = GREATEST(letter_progress.mastery_level, EXCLUDED.mastery_level),
      correct_count = GREATEST(letter_progress.correct_count, EXCLUDED.correct_count),
      attempt_count = GREATEST(letter_progress.attempt_count, EXCLUDED.attempt_count),
      last_seen = GREATEST(letter_progress.last_seen, EXCLUDED.last_seen);
  END LOOP;

  -- Lesson history: append every guest event as a new row.
  FOR v_elem IN SELECT * FROM jsonb_array_elements(p_lesson_history)
  LOOP
    INSERT INTO lesson_history (
      user_id, chapter_id, lesson_id, xp_earned, accuracy, completed_at
    )
    VALUES (
      p_user_id,
      v_elem->>'chapter_id',
      v_elem->>'lesson_id',
      COALESCE((v_elem->>'xp_earned')::int, 0),
      COALESCE((v_elem->>'accuracy')::numeric, 0),
      COALESCE((v_elem->>'completed_at')::timestamptz, now())
    );
  END LOOP;
END;
$$;
