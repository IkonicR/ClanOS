import { NextResponse } from 'next/server'
import { createClient as createAdmin } from '@/lib/supabase/admin'

function scoreClamp(v: number) { return Math.max(0, Math.min(100, Math.round(v))) }

export async function POST() {
  const cronSecret = process.env.CRON_SECRET
  const headersPromise = (await import('next/headers')).headers()
  const reqSecret = (await headersPromise).get('x-cron-secret')
  if (!cronSecret || reqSecret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized cron' }, { status: 401 })
  }

  const supabase = createAdmin()

  // Pull recent data window (last 90 days)
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

  // member_daily_snapshots for participation/consistency
  const { data: snaps } = await supabase
    .from('member_daily_snapshots')
    .select('player_tag, name, clan_tag, snapshot_at, donations, donations_received, war_stars, legend_trophies')
    .gte('snapshot_at', since)
    .limit(5000)

  // war_attacks for offense/cleanup/clutch
  const { data: attacks } = await supabase
    .from('war_attacks')
    .select('attacker_tag, stars, destruction, map_position, war_end_time, is_cwl')
    .gte('war_end_time', since)
    .limit(20000)

  // Simple aggregation heuristics
  const byPlayer: Record<string, any> = {}
  snaps?.forEach((s: any) => {
    const p = (byPlayer[s.player_tag] ||= { snaps: [], attacks: [] })
    p.snaps.push(s)
  })
  attacks?.forEach((a: any) => {
    const p = (byPlayer[a.attacker_tag] ||= { snaps: [], attacks: [] })
    p.attacks.push(a)
  })

  const profiles = [] as any[]
  for (const [tag, agg] of Object.entries(byPlayer)) {
    const totalAttacks = agg.attacks.length
    const offense = scoreClamp((agg.attacks.reduce((sum: number, a: any) => sum + (a.stars ?? 0), 0) / Math.max(totalAttacks, 1)) * 33)
    const cleanup = scoreClamp((agg.attacks.filter((a: any) => (a.stars ?? 0) >= 2).length / Math.max(totalAttacks, 1)) * 100)
    const clutch = scoreClamp((agg.attacks.filter((a: any) => (a.stars ?? 0) === 3).length / Math.max(totalAttacks, 1)) * 100)
    const participation = scoreClamp((agg.snaps.length / 90) * 100)
    const capital = scoreClamp(50) // placeholder until capital member detail tracked
    const consistency = scoreClamp(100 - Math.abs(50 - offense))

    profiles.push({
      player_tag: tag,
      updated_at: new Date().toISOString(),
      offense_skill: offense,
      cleanup_skill: cleanup,
      consistency,
      clutch,
      participation,
      capital_efficiency: capital,
      data: { totalAttacks },
    })
  }

  if (profiles.length) {
    await supabase
      .from('member_skill_profiles')
      .upsert(profiles, { onConflict: 'player_tag' })
  }

  return NextResponse.json({ ok: true, profiles: profiles.length })
}

export async function GET() { return POST() }
