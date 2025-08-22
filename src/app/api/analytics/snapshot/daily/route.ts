import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getClanInfo } from '@/lib/coc-api'

function getUtcDayStart(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0))
}

export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Resolve active clan tag from linked profile first, then profile
  const [{ data: activeLinkedProfile }, { data: userProfile }] = await Promise.all([
    supabase.from('linked_profiles').select('clan_tag').eq('user_id', user.id).eq('is_active', true).single(),
    supabase.from('profiles').select('clan_tag').eq('id', user.id).single(),
  ])
  const clanTag = activeLinkedProfile?.clan_tag || userProfile?.clan_tag
  if (!clanTag) return NextResponse.json({ error: 'User is not in a clan' }, { status: 404 })

  try {
    // Fetch clan with memberList
    const clan = await getClanInfo(clanTag)
    const members = Array.isArray(clan?.memberList) ? clan.memberList : []

    const snapshotAt = getUtcDayStart()

    // Prepare clan snapshot row
    const clanRow = {
      snapshot_at: snapshotAt.toISOString(),
      clan_tag: clan.tag as string,
      clan_level: clan.clanLevel ?? null,
      member_count: clan.members ?? members.length ?? null,
      clan_points: clan.clanPoints ?? null,
      clan_versus_points: clan.clanVersusPoints ?? null,
      war_wins: clan.warWins ?? null,
      war_losses: clan.warLosses ?? null,
      war_ties: clan.warTies ?? null,
      war_win_streak: clan.warWinStreak ?? null,
      required_trophies: clan.requiredTrophies ?? null,
      data: clan ?? null,
    }

    // Upsert clan snapshot (requires a unique/PK on (clan_tag, snapshot_at))
    const { error: clanUpsertError } = await supabase
      .from('clan_daily_snapshots')
      .upsert(clanRow, { onConflict: 'clan_tag,snapshot_at' })

    if (clanUpsertError) throw clanUpsertError

    // Prepare member snapshot rows. We use only fields available from memberList to keep API load light.
    const memberRows = members.map((m: any) => ({
      snapshot_at: snapshotAt.toISOString(),
      player_tag: m.tag as string,
      clan_tag: clan.tag as string,
      name: m.name ?? null,
      role: m.role ?? null,
      clan_rank: m.clanRank ?? null,
      trophies: m.trophies ?? null,
      best_trophies: null, // not present on memberList; available on /players/{tag}
      donations: m.donations ?? null,
      donations_received: m.donationsReceived ?? null,
      war_stars: null, // not present on memberList; available on /players/{tag}
      town_hall: m.townHallLevel ?? null,
      builder_hall: null,
      legend_trophies: null,
      labels: null,
      heroes: null,
      troops: null,
      spells: null,
      data: m ?? null,
    }))

    // Upsert members (requires a unique/PK on (player_tag, snapshot_at))
    if (memberRows.length > 0) {
      const { error: memberUpsertError } = await supabase
        .from('member_daily_snapshots')
        .upsert(memberRows, { onConflict: 'player_tag,snapshot_at' })
      if (memberUpsertError) throw memberUpsertError
    }

    return NextResponse.json({ ok: true, snapshotAt: snapshotAt.toISOString(), clanTag: clan.tag, members: memberRows.length })
  } catch (err: any) {
    console.error('Snapshot error', err)
    return NextResponse.json({ error: err?.message || 'Snapshot failed' }, { status: 500 })
  }
}

// Allow GET to invoke as well (useful for testing)
export async function GET() {
  return POST()
}
