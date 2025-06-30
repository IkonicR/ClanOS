import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getClanInfo, getClanWarLog, getCurrentWar } from '@/lib/coc-api';

export async function GET() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's clan_tag (prioritizing active linked profile)
    const { data: userProfile } = await supabase
        .from('profiles')
        .select('clan_tag')
        .eq('id', user.id)
        .single();

    const { data: activeLinkedProfile } = await supabase
        .from('linked_profiles')
        .select('clan_tag')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

    const clanTag = activeLinkedProfile?.clan_tag || userProfile?.clan_tag;
    
    if (!clanTag) {
        return NextResponse.json({ error: 'User is not in a clan' }, { status: 404 });
    }

    try {
        // Fetch clan data
        const [clanInfo, warLog, currentWar] = await Promise.all([
            getClanInfo(clanTag),
            getClanWarLog(clanTag),
            getCurrentWar(clanTag).catch(() => null) // Current war might not exist
        ]);

        const members = clanInfo.memberList || [];
        
        // Calculate overview metrics
        const totalMembers = members.length;
        const totalTrophies = members.reduce((sum: number, member: any) => sum + member.trophies, 0);
        const avgTrophies = totalMembers > 0 ? Math.round(totalTrophies / totalMembers) : 0;
        
        const totalDonations = members.reduce((sum: number, member: any) => sum + member.donations, 0);
        const totalReceived = members.reduce((sum: number, member: any) => sum + member.donationsReceived, 0);
        const donationRatio = totalReceived > 0 ? Number((totalDonations / totalReceived).toFixed(2)) : 0;

        // War statistics from war log
        const recentWars = warLog?.items?.slice(0, 10) || [];
        const warStats = {
            totalWars: recentWars.length,
            wins: recentWars.filter((war: any) => war.result === 'win').length,
            losses: recentWars.filter((war: any) => war.result === 'lose').length,
            ties: recentWars.filter((war: any) => war.result === 'tie').length
        };
        
        const winRate = warStats.totalWars > 0 ? 
            Number(((warStats.wins / warStats.totalWars) * 100).toFixed(1)) : 0;

        // League distribution
        const leagueDistribution = members.reduce((acc: any, member: any) => {
            const leagueName = member.league?.name || 'Unranked';
            acc[leagueName] = (acc[leagueName] || 0) + 1;
            return acc;
        }, {});

        // Town Hall distribution
        const thDistribution = members.reduce((acc: any, member: any) => {
            const th = `TH${member.townHallLevel}`;
            acc[th] = (acc[th] || 0) + 1;
            return acc;
        }, {});

        // Role distribution
        const roleDistribution = members.reduce((acc: any, member: any) => {
            const role = member.role === 'coLeader' ? 'Co-Leader' : 
                        member.role.charAt(0).toUpperCase() + member.role.slice(1);
            acc[role] = (acc[role] || 0) + 1;
            return acc;
        }, {});

        // Top performers
        const topDonators = [...members]
            .sort((a: any, b: any) => b.donations - a.donations)
            .slice(0, 5)
            .map((member: any) => ({
                name: member.name,
                tag: member.tag,
                donations: member.donations,
                received: member.donationsReceived
            }));

        const topTrophyEarners = [...members]
            .sort((a: any, b: any) => b.trophies - a.trophies)
            .slice(0, 5)
            .map((member: any) => ({
                name: member.name,
                tag: member.tag,
                trophies: member.trophies,
                league: member.league?.name || 'Unranked'
            }));

        // Current war status
        let currentWarStatus = null;
        if (currentWar && currentWar.state !== 'notInWar') {
            const ourClan = currentWar.clan;
            const opponent = currentWar.opponent;
            
            currentWarStatus = {
                state: currentWar.state,
                teamSize: currentWar.teamSize,
                ourStars: ourClan.stars,
                ourDestruction: ourClan.destructionPercentage,
                opponentStars: opponent.stars,
                opponentDestruction: opponent.destructionPercentage,
                opponentName: opponent.name,
                timeLeft: currentWar.endTime
            };
        }

        const analytics = {
            clanInfo: {
                name: clanInfo.name,
                tag: clanInfo.tag,
                level: clanInfo.clanLevel,
                badgeUrl: clanInfo.badgeUrls.medium,
                description: clanInfo.description,
                warLeague: clanInfo.warLeague?.name || 'Unranked',
                clanPoints: clanInfo.clanPoints,
                clanVersusPoints: clanInfo.clanVersusPoints
            },
            overview: {
                totalMembers,
                totalTrophies,
                avgTrophies,
                totalDonations,
                totalReceived,
                donationRatio,
                winRate,
                warWinStreak: clanInfo.warWinStreak || 0
            },
            warStats,
            distributions: {
                leagues: leagueDistribution,
                townHalls: thDistribution,
                roles: roleDistribution
            },
            topPerformers: {
                donators: topDonators,
                trophyEarners: topTrophyEarners
            },
            currentWar: currentWarStatus,
            lastUpdated: new Date().toISOString()
        };

        return NextResponse.json(analytics);
    } catch (error) {
        console.error('Error fetching analytics:', error);
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: message }, { status: 500 });
    }
} 