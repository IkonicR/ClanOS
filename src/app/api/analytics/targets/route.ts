import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getClanInfo, getCurrentWar } from '@/lib/coc-api'

function clamp(v:number, min:number, max:number){ return Math.max(min, Math.min(max, v)) }

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

  try {
    // Current war
    const war = await getCurrentWar(clanTag)
    if (!war || war.state === 'notInWar') return NextResponse.json({ error: 'Clan is not in war' }, { status: 400 })

    const ourMembers: any[] = Array.isArray(war?.clan?.members) ? war.clan.members : []
    const oppMembers: any[] = Array.isArray(war?.opponent?.members) ? war.opponent.members : []
    const teamSize = war.teamSize || Math.min(ourMembers.length, oppMembers.length)

    // Live roster: fetch skills for our current war members
    const ourTags = ourMembers.map(m => m.tag)
    const { data: skills } = await supabase
      .from('member_skill_profiles')
      .select('*')
      .in('player_tag', ourTags)

    const tagToSkill = new Map<string, any>()
    ;(skills || []).forEach(s => tagToSkill.set(s.player_tag, s))

    // Build lineup: pick top teamSize by composite score
    const lineup = ourMembers.map(m => {
      const s = tagToSkill.get(m.tag) || {}
      const offense = s.offense_skill ?? 0
      const clutch = s.clutch ?? 0
      const consistency = s.consistency ?? 0
      const composite = Math.round(offense * 0.5 + clutch * 0.3 + consistency * 0.2)
      return { tag: m.tag, name: m.name, townHall: m.townhallLevel || m.townHallLevel || 0, role: m.role, mapPosition: m.mapPosition, scores: { offense, clutch, consistency, composite } }
    }).sort((a,b)=> b.scores.composite - a.scores.composite).slice(0, teamSize)

    // Opponent defenders sorted by TH desc then map position
    const defenders = oppMembers
      .map(d => ({ tag: d.tag, name: d.name, townHall: d.townhallLevel || d.townHallLevel || 0, mapPosition: d.mapPosition }))
      .sort((a,b)=> (b.townHall - a.townHall) || (a.mapPosition - b.mapPosition))

    // Greedy assignment: attackers high-to-low composite choose best-scoring defender
    const assigned = new Set<number>()
    const assignments: any[] = []

    for (const attacker of lineup) {
      let bestIdx = -1
      let bestScore = -1e9
      let bestPred = 0
      defenders.forEach((def, idx) => {
        if (assigned.has(idx)) return
        const thDiff = (attacker.townHall || 0) - (def.townHall || 0) // positive if attacker TH >= defender
        const offense = attacker.scores.offense
        const clutch = attacker.scores.clutch
        // heuristic: base on offense, penalize if TH lower, slight bonus for clutch
        const score = offense * 1.0 + clutch * 0.2 + thDiff * 15
        // predicted stars approx 1.5 + offense factor + th advantage
        const predStars = clamp(1.5 + (offense - 50) / 50 + thDiff * 0.25, 0, 3)
        if (score > bestScore) { bestScore = score; bestIdx = idx; bestPred = predStars }
      })
      if (bestIdx >= 0) {
        const def = defenders[bestIdx]
        assigned.add(bestIdx)
        assignments.push({ attacker, defender: def, predictedStars: Math.round(bestPred * 10)/10, rationale: { thDiff: (attacker.townHall||0)-(def.townHall||0), offense: attacker.scores.offense, clutch: attacker.scores.clutch } })
      }
    }

    // Any unassigned defenders become alternates; any unassigned attackers if defenders < attackers
    const alternates = defenders.filter((_, idx)=> !assigned.has(idx)).slice(0, Math.max(0, teamSize - assignments.length))

    return NextResponse.json({
      war: { state: war.state, teamSize, opponent: { name: war.opponent?.name, tag: war.opponent?.tag } },
      lineup,
      assignments,
      alternates,
      generatedAt: new Date().toISOString(),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to build targets' }, { status: 500 })
  }
}
