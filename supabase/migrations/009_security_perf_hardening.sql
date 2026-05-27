-- Hardening migration: bound merge values to prevent XP fraud, add hot-path
-- indexes, validate timezone in save_lesson_progress, add a dedicated
-- streak-reset RPC so GET /api/user is side-effect-free, and make DELETE
-- policies explicit.

-- =============================================================================
-- Indexes for the hot paths
-- =============================================================================

-- Every authed read filters by user_id under RLS; the unique(user_id, symbol)
-- index covers upserts but not bare user_id scans.
CREATE INDEX IF NOT EXISTS letter_progress_user_id_idx
  ON public.letter_progress(user_id);

CREATE INDEX IF NOT EXISTS lesson_history_user_id_completed_at_idx
  ON public.lesson_history(user_id, completed_at DESC);

-- Leaderboard sorts by xp DESC across the whole table.
CREATE INDEX IF NOT EXISTS profiles_xp_desc_idx
  ON public.profiles(xp DESC NULLS LAST);

-- Cron looks up subscriptions by user.
CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx
  ON public.push_subscriptions(user_id);

-- =============================================================================
-- Explicit DELETE policies (the `for all using` policies in 001 already cover
-- DELETE, but making them explicit is safer if a future migration narrows them).
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'letter_progress'
      AND policyname = 'Users can delete own progress'
  ) THEN
    CREATE POLICY "Users can delete own progress"
      ON public.letter_progress FOR DELETE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'lesson_history'
      AND policyname = 'Users can delete own history'
  ) THEN
    CREATE POLICY "Users can delete own history"
      ON public.lesson_history FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- =============================================================================
-- Hardened merge_guest_progress: clamp XP/streak so a tampered guest snapshot
-- can't inflate the authenticated profile. Also validate timezone offset and
-- cap per-lesson xp_earned defensively (schema enforces this too).
-- =============================================================================

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
  v_xp_per_lesson_cap constant int := 1000;
  v_profile_xp_cap constant int := 5000000;
  v_streak_cap constant int := 3650;
BEGIN
  -- Profile clamps — even if schema validation is bypassed somehow.
  v_local_xp := LEAST(
    GREATEST(COALESCE((p_profile->>'xp')::int, 0), 0),
    v_profile_xp_cap
  );
  v_local_streak := LEAST(
    GREATEST(COALESCE((p_profile->>'streak')::int, 0), 0),
    v_streak_cap
  );
  v_local_date := NULLIF(p_profile->>'last_activity_date', '')::date;

  UPDATE profiles
  SET
    xp = LEAST(GREATEST(COALESCE(xp, 0), v_local_xp), v_profile_xp_cap),
    streak = LEAST(GREATEST(COALESCE(streak, 0), v_local_streak), v_streak_cap),
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
      LEAST(GREATEST(COALESCE((v_elem->>'mastery_level')::int, 0), 0), 3),
      GREATEST(COALESCE((v_elem->>'correct_count')::int, 0), 0),
      GREATEST(COALESCE((v_elem->>'attempt_count')::int, 0), 0),
      COALESCE((v_elem->>'last_seen')::timestamptz, now())
    )
    ON CONFLICT (user_id, symbol) DO UPDATE SET
      mastery_level = GREATEST(letter_progress.mastery_level, EXCLUDED.mastery_level),
      correct_count = GREATEST(letter_progress.correct_count, EXCLUDED.correct_count),
      attempt_count = GREATEST(letter_progress.attempt_count, EXCLUDED.attempt_count),
      last_seen = GREATEST(letter_progress.last_seen, EXCLUDED.last_seen);
  END LOOP;

  -- Lesson history: append every guest event, but make this idempotent so a
  -- failed-then-retried merge doesn't double-count. The unique index below
  -- backs the ON CONFLICT DO NOTHING.
  FOR v_elem IN SELECT * FROM jsonb_array_elements(p_lesson_history)
  LOOP
    INSERT INTO lesson_history (
      user_id, chapter_id, lesson_id, xp_earned, accuracy, completed_at
    )
    VALUES (
      p_user_id,
      v_elem->>'chapter_id',
      v_elem->>'lesson_id',
      LEAST(GREATEST(COALESCE((v_elem->>'xp_earned')::int, 0), 0), v_xp_per_lesson_cap),
      LEAST(GREATEST(COALESCE((v_elem->>'accuracy')::numeric, 0), 0), 1),
      COALESCE((v_elem->>'completed_at')::timestamptz, now())
    )
    ON CONFLICT (user_id, lesson_id, completed_at) DO NOTHING;
  END LOOP;
END;
$$;

-- Idempotency for lesson_history. A retry of a failed merge would otherwise
-- duplicate rows since the RPC blindly appended. Same (user, lesson, instant)
-- is treated as one event.
CREATE UNIQUE INDEX IF NOT EXISTS lesson_history_user_lesson_completed_idx
  ON public.lesson_history(user_id, lesson_id, completed_at);

-- =============================================================================
-- save_lesson_progress: add server-side timezone validation + bound per-call XP
-- so a direct RPC call (bypassing Zod) can't inflate XP.
-- =============================================================================

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
  v_xp int;
  v_accuracy double precision;
  v_tz int;
BEGIN
  -- Hard bounds on caller input (defense in depth — schema also enforces).
  IF p_timezone_offset IS NULL OR p_timezone_offset < -720 OR p_timezone_offset > 840 THEN
    v_tz := 0;
  ELSE
    v_tz := p_timezone_offset;
  END IF;

  v_xp := LEAST(GREATEST(COALESCE(p_xp_earned, 0), 0), 1000);
  v_accuracy := LEAST(GREATEST(COALESCE(p_accuracy, 0), 0), 1);

  v_local_date := (now() - (v_tz * interval '1 minute'))::date;

  -- Insert lesson history with clamped values.
  INSERT INTO lesson_history (user_id, chapter_id, lesson_id, xp_earned, accuracy)
  VALUES (p_user_id, p_chapter_id, p_lesson_id, v_xp, v_accuracy);

  -- Upsert letter progress with atomic increments. Each symbol row is locked
  -- only for its own upsert; no need to widen the profile lock around this.
  FOR v_elem IN SELECT * FROM jsonb_array_elements(p_symbol_results)
  LOOP
    INSERT INTO letter_progress (user_id, symbol, mastery_level, correct_count, attempt_count, last_seen)
    VALUES (
      p_user_id,
      v_elem->>'symbol',
      LEAST(GREATEST((v_elem->>'masteryLevel')::int, 0), 3),
      GREATEST((v_elem->>'correct')::int, 0),
      GREATEST((v_elem->>'attempts')::int, 0),
      now()
    )
    ON CONFLICT (user_id, symbol) DO UPDATE SET
      mastery_level = LEAST(GREATEST((v_elem->>'masteryLevel')::int, 0), 3),
      correct_count = letter_progress.correct_count + GREATEST((v_elem->>'correct')::int, 0),
      attempt_count = letter_progress.attempt_count + GREATEST((v_elem->>'attempts')::int, 0),
      last_seen = now();
  END LOOP;

  -- Lock the profile row only for the streak/XP read-compute-write window.
  SELECT streak, last_activity_date
  INTO v_current_streak, v_last_activity
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_last_activity = v_local_date THEN
    v_new_streak := v_current_streak;
  ELSIF v_last_activity = v_local_date - 1 THEN
    v_new_streak := v_current_streak + 1;
  ELSE
    v_new_streak := 1;
  END IF;

  -- Bound the streak so a clock-skew attack can't push it to absurd values.
  v_new_streak := LEAST(v_new_streak, 3650);

  UPDATE profiles
  SET xp = LEAST(COALESCE(xp, 0) + v_xp, 5000000),
      streak = v_new_streak,
      last_activity_date = v_local_date
  WHERE id = p_user_id;
END;
$$;

-- =============================================================================
-- reset_streak_if_broken: atomic check + reset so the GET /api/user path
-- doesn't need to do a read-then-write outside of a single statement.
-- =============================================================================

CREATE OR REPLACE FUNCTION reset_streak_if_broken(
  p_user_id uuid,
  p_timezone_offset int DEFAULT 0
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_local_date date;
  v_yesterday date;
  v_new_streak int;
  v_tz int;
BEGIN
  IF p_timezone_offset IS NULL OR p_timezone_offset < -720 OR p_timezone_offset > 840 THEN
    v_tz := 0;
  ELSE
    v_tz := p_timezone_offset;
  END IF;

  v_local_date := (now() - (v_tz * interval '1 minute'))::date;
  v_yesterday := v_local_date - 1;

  UPDATE profiles
  SET streak = 0
  WHERE id = p_user_id
    AND last_activity_date IS NOT NULL
    AND last_activity_date <> v_local_date
    AND last_activity_date <> v_yesterday
  RETURNING streak INTO v_new_streak;

  RETURN COALESCE(v_new_streak, -1);
END;
$$;
