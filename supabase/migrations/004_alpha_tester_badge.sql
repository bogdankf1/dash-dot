-- Add alpha tester flag (defaults to false for all new users)
alter table public.profiles add column is_alpha_tester boolean default false;

-- Grant alpha tester badge to all existing users except bogdankf1@gmail.com
update public.profiles
set is_alpha_tester = true
where id != (
  select id from auth.users where email = 'bogdankf1@gmail.com'
);
