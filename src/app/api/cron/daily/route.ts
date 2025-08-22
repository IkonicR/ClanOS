import { NextResponse } from 'next/server'
import { createClient as createAdmin } from '@/lib/supabase/admin'
import { getClanInfo } from '@/lib/coc-api'
import { getTrackedClans } from '@/lib/cron-utils'

function getUtcDayStart(date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0))
  return d.toISOString()
}

export async function POST() {
  const cronSecret = process.env.CRON_SECRET
  const headersPromise = (await import('next/headers')).headers()
  const reqSecret = (await headersPromise).get('x-cron-secret')
  if (!cronSecret || reqSecret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized cron' }, { status: 401 })
  }

  const supabase = createAdmin()
  const clans = await getTrackedClans(supabase)
  if (clans.length === 0) return NextResponse.json({ ok: true, clansProcessed: 0 })

  const snapshotAt = getUtcDayStart()
  let processed = 0
  let memberRows = 0

  for (const clanTag of clans) {
    try {
      const clan = await getClanInfo(clanTag)
      const members = Array.isArray(clan?.memberList) ? clan.memberList : []

      const clanRow = {
        snapshot_at: snapshotAt,
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

      // Temporarily disabled due to schema mismatch
      // const { error: cErr } = await supabase
      //   .from('clan_daily_snapshots')
      //   .upsert(clanRow, { onConflict: 'clan_tag,snapshot_at' })
      // if (cErr) throw cErr

      const mRows = members.map((m: any) => ({
        snapshot_at: snapshotAt,
        player_tag: m.tag as string,
        clan_tag: clan.tag as string,
        name: m.name ?? null,
        role: m.role ?? null,
        clan_rank: m.clanRank ?? null,
        trophies: m.trophies ?? null,
        best_trophies: null,
        donations: m.donations ?? null,
        donations_received: m.donationsReceived ?? null,
        war_stars: null,
        town_hall: m.townHallLevel ?? null,
        builder_hall: null,
        legend_trophies: null,
        labels: null,
        heroes: null,
        troops: null,
        spells: null,
        data: m ?? null,
      }))

      if (mRows.length > 0) {
        // Temporarily disabled due to schema mismatch
        // const { error: mErr } = await supabase
        //   .from('member_daily_snapshots')
        //   .upsert(mRows, { onConflict: 'player_tag,snapshot_at' })
        // if (mErr) throw mErr
        memberRows += mRows.length
      }

      processed++
    } catch (e) {
      // continue
    }
  }

  return NextResponse.json({ ok: true, snapshotAt, clansProcessed: processed, memberRows })
}

export async function GET() {
  return POST()
}
