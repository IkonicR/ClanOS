create or replace function update_clan_tag(user_id uuid, new_clan_tag text)
returns void
language plpgsql
security definer
as $$
begin
  update public.profiles
  set clan_tag = new_clan_tag
  where id = user_id;
end;
$$ 