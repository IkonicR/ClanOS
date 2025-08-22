import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function clampScore(v: number) { return Math.max(0, Math.min(100, Math.round(v))) }

export async function GET(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Resolve clan tag
  const { data: activeLinkedProfile } = await supabase
    .from('linked_profiles')
    .select('clan_tag')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  const { data: userProfile } = await supabase
    .from('profiles')
    .select('clan_tag')
    .eq('id', user.id)
    .single()

  const clanTag = activeLinkedProfile?.clan_tag || userProfile?.clan_tag
  if (!clanTag) return NextResponse.json({ error: 'User is not in a clan' }, { status: 404 })

  const url = new URL(req.url)
  const daysParam = url.searchParams.get('days')
  const windowDays = Math.max(7, Math.min(180, Number(daysParam) || 60))
  const sinceIso = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString()

  // Fetch rosters, attacks, and war flags
  const [{ data: rosters }, { data: attacks }, { data: wars }] = await Promise.all([
    supabase
      .from('war_rosters')
      .select('war_end_time, member_tag, member_name, map_position')
      .eq('clan_tag', clanTag)
      .gte('war_end_time', sinceIso)
      .limit(10000),
    supabase
      .from('war_attacks')
      .select('war_end_time, attacker_tag')
      .eq('clan_tag', clanTag)
      .gte('war_end_time', sinceIso)
      .limit(20000),
    supabase
      .from('war_aggregates')
      .select('end_time, is_cwl, team_size')
      .eq('clan_tag', clanTag)
      .gte('end_time', sinceIso)
      .limit(1000),
  ])

  const rosterArr = rosters || []
  const attackArr = attacks || []
  const warsArr = wars || []

  // Build maps
  const warIsCwl = new Map<string, boolean>()
  warsArr.forEach(w => warIsCwl.set(new Date(w.end_time).toISOString(), !!w.is_cwl))

  // Expected attacks per war
  const warExpected = new Map<string, number>()
  warsArr.forEach(w => warExpected.set(new Date(w.end_time).toISOString(), w.is_cwl ? 1 : 2))

  // Attack counts per war/member
  const usedByWarMember = new Map<string, number>() // key: war_end_time|member_tag
  for (const a of attackArr) {
    const key = `${new Date(a.war_end_time).toISOString()}|${a.attacker_tag}`
    usedByWarMember.set(key, (usedByWarMember.get(key) || 0) + 1)
  }

  // Aggregate per player
  const byPlayer: Record<string, any> = {}
  const warSet = new Set<string>()
  for (const r of rosterArr) {
    const warKey = new Date(r.war_end_time).toISOString()
    warSet.add(warKey)
    const expected = warExpected.get(warKey) ?? 2
    const used = usedByWarMember.get(`${warKey}|${r.member_tag}`) || 0
    const missed = Math.max(0, expected - used)

    if (!byPlayer[r.member_tag]) {
      byPlayer[r.member_tag] = {
        tag: r.member_tag,
        name: r.member_name,
        wars: 0,
        expected: 0,
        used: 0,
        missed: 0,
        lastWar: warKey,
        lastMisses: [] as string[],
      }
    }
    const p = byPlayer[r.member_tag]
    p.wars += 1
    p.expected += expected
    p.used += used
    p.missed += missed
    if (missed > 0) p.lastMisses.push(warKey)
    if (new Date(warKey).getTime() > new Date(p.lastWar).getTime()) p.lastWar = warKey
  }

  const totalWars = warSet.size
  const results = Object.values(byPlayer).map((p: any) => {
    const participationRate = p.wars > 0 ? clampScore((p.used > 0 ? 1 : 0) * 100) : 0 // simplistic per-war participation if used>0
    const missRate = p.expected > 0 ? Math.round((p.missed / p.expected) * 100) : 0
    // Risk score: more weight to misses, some to low participation, recent misses amplify
    const recentMissPenalty = p.lastMisses.some((w: string)=> new Date(w).getTime() > Date.now() - 14*24*60*60*1000) ? 15 : 0
    const risk = clampScore(missRate * 0.7 + (100 - participationRate) * 0.3 + recentMissPenalty)
    return {
      tag: p.tag,
      name: p.name,
      wars: p.wars,
      totalWars,
      expected: p.expected,
      used: p.used,
      missed: p.missed,
      participationRate,
      missRate,
      lastWar: p.lastWar,
      risk,
    }
  }).sort((a: any, b: any) => b.risk - a.risk)

  const summary = {
    windowDays,
    warsAnalyzed: totalWars,
    membersAnalyzed: results.length,
    avgMissRate: results.length ? Math.round(results.reduce((s, r)=> s + r.missRate, 0) / results.length) : 0,
  }

  return NextResponse.json({ summary, results, generatedAt: new Date().toISOString() })
}
