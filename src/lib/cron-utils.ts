import { createClient as createAdmin } from '@/lib/supabase/admin'

export type AdminClient = ReturnType<typeof createAdmin>

export async function getTrackedClans(supabase: AdminClient): Promise<string[]> {
  const clans = new Set<string>()

  const { data: fromLinked } = await supabase
    .from('linked_profiles')
    .select('clan_tag')
    .not('clan_tag', 'is', null)

  fromLinked?.forEach((r: any) => r?.clan_tag && clans.add(r.clan_tag))

  const { data: fromProfiles } = await supabase
    .from('profiles')
    .select('clan_tag')
    .not('clan_tag', 'is', null)

  fromProfiles?.forEach((r: any) => r?.clan_tag && clans.add(r.clan_tag))

  return Array.from(clans)
}
