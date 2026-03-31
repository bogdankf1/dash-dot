-- Add loyal fan badge (unique badge for the most dedicated user)
alter table public.profiles
  add column if not exists is_loyal_fan boolean default false;

-- Award to Аліна Бурухіна
update public.profiles
  set is_loyal_fan = true
  where id = 'ecd9ad9e-c288-492d-951b-968f6a45ed3e';
