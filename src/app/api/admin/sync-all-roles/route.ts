import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getClanInfo } from '@/lib/coc-api';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all profiles with clan_tag and player_tag
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, player_tag, clan_tag, role, in_game_name')
      .not('clan_tag', 'is', null)
      .not('player_tag', 'is', null);

    if (profilesError) {
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
    }

    const results = {
      processed: 0,
      updated: 0,
      errors: 0,
      details: [] as any[]
    };

    // Group profiles by clan_tag to reduce API calls
    const profilesByClan = profiles.reduce((acc, profile) => {
      if (!acc[profile.clan_tag!]) {
        acc[profile.clan_tag!] = [];
      }
      acc[profile.clan_tag!].push(profile);
      return acc;
    }, {} as Record<string, typeof profiles>);

    for (const [clanTag, clanProfiles] of Object.entries(profilesByClan)) {
      try {
        // Fetch clan data from COC API using the helper function
        const clanData = await getClanInfo(clanTag);

        for (const profile of clanProfiles) {
          results.processed++;
          
          const member = clanData.memberList?.find((m: any) => m.tag === profile.player_tag);

          if (!member) {
            results.errors++;
            results.details.push({
              playerTag: profile.player_tag,
              error: 'Player not found in clan'
            });
            continue;
          }

                     // Map COC role to our role system
           let newRole: string;
           switch (member.role.toLowerCase()) {
             case 'leader':
               newRole = 'leader';
               break;
             case 'co-leader':
             case 'coleader':
               newRole = 'coLeader';
               break;
             case 'elder':
               newRole = 'elder';
               break;
             case 'member':
             default:
               newRole = 'user';
               break;
           }

          // Only update if role changed
          if (profile.role !== newRole || profile.in_game_name !== member.name) {
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ 
                role: newRole,
                in_game_name: member.name
              })
              .eq('id', profile.id);

            if (updateError) {
              results.errors++;
              results.details.push({
                playerTag: profile.player_tag,
                error: `Failed to update: ${updateError.message}`
              });
            } else {
              results.updated++;
              results.details.push({
                playerTag: profile.player_tag,
                oldRole: profile.role,
                newRole: newRole,
                name: member.name
              });
            }
          }
        }

        // Add a small delay to avoid hitting API rate limits
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        results.errors += clanProfiles.length;
        results.details.push({
          clanTag,
          error: `Exception: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }

    return NextResponse.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('Error syncing all roles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 