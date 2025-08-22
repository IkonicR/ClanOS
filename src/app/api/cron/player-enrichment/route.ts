import { NextResponse } from 'next/server'
import { createClient as createAdmin } from '@/lib/supabase/admin'
import { getPlayerInfo } from '@/lib/coc-api'

export async function POST() {
  const cronSecret = process.env.CRON_SECRET
  const headersPromise = (await import('next/headers')).headers()
  const reqSecret = (await headersPromise).get('x-cron-secret')
  if (!cronSecret || reqSecret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized cron' }, { status: 401 })
  }

  const supabase = createAdmin()
  // Fetch latest N snapshot rows missing enrichment (last 7 days)
  const { data: rows } = await supabase
    .from('member_daily_snapshots')
    .select('player_tag, snapshot_at')
    .gte('snapshot_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .is('heroes', null)
    .limit(500)

  if (!rows || rows.length === 0) return NextResponse.json({ ok: true, enriched: 0 })

  let enriched = 0

  for (const r of rows as any[]) {
    try {
      const player = await getPlayerInfo(String(r.player_tag))
      const update = {
        heroes: player?.heroes || null,
        troops: player?.troops || null,
        spells: player?.spells || null,
        legend_trophies: player?.legendStatistics?.legendTrophies ?? null,
        best_trophies: player?.bestTrophies ?? null,
        war_stars: player?.warStars ?? null,
        builder_hall: player?.builderHallLevel ?? null,
        labels: player?.labels || null,
        name: player?.name ?? null,
      }

      const { error } = await supabase
        .from('member_daily_snapshots')
        .update(update)
        .eq('player_tag', r.player_tag)
        .eq('snapshot_at', r.snapshot_at)

      if (!error) enriched++
    } catch (e) {
      // continue
    }
  }

  return NextResponse.json({ ok: true, enriched })
}

export async function GET() { return POST() }
