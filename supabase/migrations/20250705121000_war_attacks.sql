-- Store per-attack events for skill analysis

create table if not exists war_attacks (
  id bigserial primary key,
  clan_tag text not null,
  war_end_time timestamptz not null,
  is_cwl boolean not null default false,
  attacker_tag text not null,
  attacker_name text,
  defender_tag text,
  order_num int,
  stars int,
  destruction numeric,
  map_position int,
  created_at timestamptz not null default now(),
  data jsonb
);

create unique index if not exists uq_war_attacks
  on war_attacks (clan_tag, war_end_time, attacker_tag, coalesce(defender_tag,''), coalesce(order_num,0));

create index if not exists idx_war_attacks_player_time
  on war_attacks (attacker_tag, war_end_time desc);


