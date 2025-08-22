-- Member skill tracking tables

create table if not exists member_skill_profiles (
  player_tag text primary key,
  updated_at timestamptz not null default now(),
  -- Aggregated ratings [0-100]
  offense_skill int,
  cleanup_skill int,
  consistency int,
  clutch int,
  participation int,
  capital_efficiency int,
  -- Raw aggregates for transparency
  data jsonb
);

create table if not exists member_skill_events (
  id bigserial primary key,
  player_tag text not null,
  event_type text not null, -- 'war_attack','cwl_attack','capital_raid'
  event_time timestamptz not null,
  context jsonb,           -- e.g., {"stars":2,"destruction":78,"firstAttack":true}
  created_at timestamptz not null default now()
);

create index if not exists idx_member_skill_events_player_time
  on member_skill_events (player_tag, event_time desc);


