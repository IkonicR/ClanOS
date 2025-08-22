-- Store war roster membership for attendance/missed attack analysis

create table if not exists war_rosters (
  clan_tag text not null,
  war_end_time timestamptz not null,
  member_tag text not null,
  member_name text,
  map_position int,
  created_at timestamptz not null default now(),
  primary key (clan_tag, war_end_time, member_tag)
);

create index if not exists idx_war_rosters_player_time
  on war_rosters (member_tag, war_end_time desc);


