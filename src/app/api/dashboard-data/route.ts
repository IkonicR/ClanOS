import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

async function getClanData(userId: string) {
  const supabase = createClient();

  // Get user's profile data (prioritizing active linked profile)
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('player_tag, clan_tag')
    .eq('id', userId)
    .single();

  // Check for active linked profile
  const { data: activeLinkedProfile } = await supabase
    .from('linked_profiles')
    .select('player_tag, clan_tag')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  // Use active linked profile's data if available
  const playerTag = activeLinkedProfile?.player_tag || userProfile?.player_tag;
  const clanTag = activeLinkedProfile?.clan_tag || userProfile?.clan_tag;

  if (!playerTag || !clanTag) {
    return null;
  }

  const cocApiToken = process.env.CLASH_OF_CLANS_API_TOKEN;
  if (!cocApiToken) {
    throw new Error('Clash of Clans API token is not configured on the server.');
  }

  // Get player info for display name
  const encodedPlayerTag = encodeURIComponent(playerTag);
  const playerRes = await fetch(`https://cocproxy.royaleapi.dev/v1/players/${encodedPlayerTag}`, {
    headers: { 'Authorization': `Bearer ${cocApiToken}` },
    next: { revalidate: 300 }
  });

  if (!playerRes.ok) throw new Error(`Failed to fetch player data for tag: ${playerTag}`);

  const playerInfo = await playerRes.json();

  // Get clan info using the clan_tag from profile/linked profile
  const encodedClanTag = encodeURIComponent(clanTag);
  const clanRes = await fetch(`https://cocproxy.royaleapi.dev/v1/clans/${encodedClanTag}`, {
    headers: { 'Authorization': `Bearer ${cocApiToken}` },
    next: { revalidate: 60 }
  });

  if (!clanRes.ok) throw new Error(`Failed to fetch clan data for tag: ${clanTag}`);

  const clanInfo = await clanRes.json();

  return { playerTag, playerInfo, clanInfo };
}

async function getCurrentWar(clanTag: string) {
  const cocApiToken = process.env.CLASH_OF_CLANS_API_TOKEN;
  if (!cocApiToken) {
    throw new Error('COC API token not configured');
  }
  const encodedClanTag = encodeURIComponent(clanTag);
  const res = await fetch(`https://cocproxy.royaleapi.dev/v1/clans/${encodedClanTag}/currentwar`, {
    headers: {
      'Authorization': `Bearer ${cocApiToken}`,
    },
    next: { revalidate: 60 }
  });

  if (!res.ok) {
    if (res.status === 404) {
      return { state: 'notInWar' };
    }
    throw new Error(`Failed to fetch current war data for tag: ${clanTag}`);
  }
  return res.json();
}

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clanData = await getClanData(user.id);

    if (!clanData) {
      return NextResponse.json({ error: 'No clan data found' }, { status: 404 });
    }

    const warData = await getCurrentWar(clanData.clanInfo.tag);

    const dashboardData = {
      clanInfo: clanData.clanInfo,
      warData: warData,
      playerTag: clanData.playerTag
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Dashboard data API error:', error);
    return NextResponse.json(
      { error: 'Failed to load dashboard data' },
      { status: 500 }
    );
  }
}
