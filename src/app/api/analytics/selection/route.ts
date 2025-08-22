import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getClanInfo } from '@/lib/coc-api'

export async function GET(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Resolve clan tag (active linked profile first)
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
  const teamSizeParam = url.searchParams.get('teamSize')
  const teamSize = Math.max(5, Math.min(50, Number(teamSizeParam) || 15))

  try {
    const clan = await getClanInfo(clanTag)
    const members: any[] = Array.isArray(clan?.memberList) ? clan.memberList : []

    // Fetch skills for current members
    const tags = members.map(m => m.tag)
    const { data: skills } = await supabase
      .from('member_skill_profiles')
      .select('*')
      .in('player_tag', tags)

    const tagToSkill = new Map<string, any>()
    ;(skills || []).forEach(s => tagToSkill.set(s.player_tag, s))

    // Compose entries with member details + skill profile
    const entries = members.map(m => {
      const skill = tagToSkill.get(m.tag)
      const offense = skill?.offense_skill ?? 0
      const consistency = skill?.consistency ?? 0
      const clutch = skill?.clutch ?? 0
      const participation = skill?.participation ?? 0
      const cleanup = skill?.cleanup_skill ?? 0
      const capital = skill?.capital_efficiency ?? 0
      const composite = Math.round(offense * 0.4 + consistency * 0.25 + clutch * 0.2 + participation * 0.15)
      return {
        name: m.name,
        tag: m.tag,
        role: m.role,
        townHall: m.townHallLevel,
        trophies: m.trophies,
        skill: skill || null,
        scores: { offense, consistency, clutch, participation, cleanup, capital, composite }
      }
    })

    // Sort for lineup and roles
    const sortedByComposite = [...entries].sort((a, b) => b.scores.composite - a.scores.composite)
    const lineup = sortedByComposite.slice(0, teamSize)
    const bench = sortedByComposite.slice(teamSize)

    const openers = [...entries]
      .sort((a, b) => (b.scores.offense * 0.7 + b.scores.clutch * 0.3) - (a.scores.offense * 0.7 + a.scores.clutch * 0.3))
      .slice(0, Math.max(3, Math.floor(teamSize * 0.2)))

    const cleanups = [...entries]
      .sort((a, b) => (b.scores.cleanup * 0.6 + b.scores.consistency * 0.4) - (a.scores.cleanup * 0.6 + a.scores.consistency * 0.4))
      .slice(0, Math.max(3, Math.floor(teamSize * 0.2)))

    return NextResponse.json({
      clan: { name: clan?.name, tag: clan?.tag, level: clan?.clanLevel },
      params: { teamSize },
      lineup,
      openers,
      cleanups,
      bench,
      generatedAt: new Date().toISOString()
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to build selection' }, { status: 500 })
  }
}
