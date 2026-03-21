-- Enable extensions for cron and HTTP requests
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Schedule daily practice reminder at 12:00 Kyiv time (10:00 UTC)
select cron.schedule(
  'daily-practice-reminder',
  '0 10 * * *',
  $$
  select net.http_post(
    url := 'https://dash-dot-five.vercel.app/api/notifications/send',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer mJokP8EXV8YF+l7FbolO674LWVTAWIIj6MnIzYBWXYI='
    ),
    body := '{}'::jsonb
  );
  $$
);
