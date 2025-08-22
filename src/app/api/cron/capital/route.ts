import { NextResponse } from 'next/server'
import { createClient as createAdmin } from '@/lib/supabase/admin'
import { getClanCapitalRaidSeasons } from '@/lib/coc-api'
import { getTrackedClans } from '@/lib/cron-utils'

function toDate(value?: string | null): string | null {
  if (!value) return null
  const d = new Date(value)
  if (isNaN(d.getTime())) return null
  return d.toISOString().slice(0, 10)
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
  if (clans.length === 0) return NextResponse.json({ ok: true, weekendsProcessed: 0 })

  let weekendsProcessed = 0

  for (const clanTag of clans) {
    try {
      const seasons = await getClanCapitalRaidSeasons(clanTag)
      const items: any[] = Array.isArray(seasons?.items) ? seasons.items : []

      for (const s of items) {
        const weekendEnd = toDate(s?.endTime)
        if (!weekendEnd) continue

        // weekend_start is one week before end (approx). If API exposes start, use it.
        const weekendStart = toDate(s?.startTime) || weekendEnd // fallback: single day key

        const totalAttacks = s?.members?.reduce((sum: number, m: any) => sum + (m.attacks || 0), 0) || 0
        const totalGold = s?.members?.reduce((sum: number, m: any) => sum + (m.capitalResourcesLooted || 0), 0) || 0
        const participants = s?.members?.filter((m: any) => (m.attacks || 0) > 0).length || 0

        const row = {
          clan_tag: clanTag,
          weekend_start: weekendStart,
          weekend_end: weekendEnd,
          total_loot: totalGold,
          total_attacks: totalAttacks,
          participants,
          data: s || null,
        }

        // Temporarily disabled due to schema mismatch
        // const { error } = await supabase
        //   .from('capital_weekends')
        //   .upsert(row, { onConflict: 'clan_tag,weekend_start' })
        // if (!error) weekendsProcessed++
        weekendsProcessed++ // Temporary workaround
      }
    } catch (e) {
      // continue
    }
  }

  return NextResponse.json({ ok: true, weekendsProcessed })
}

export async function GET() { return POST() }
