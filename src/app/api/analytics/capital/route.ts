import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getClanInfo, getClanCapitalRaidSeasons } from '@/lib/coc-api';

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
        const [clanInfo, capitalRaidSeasons] = await Promise.all([
            getClanInfo(clanTag),
            getClanCapitalRaidSeasons(clanTag)
        ]);

        const members = clanInfo?.memberList || [];
        const raidSeasons = capitalRaidSeasons?.items || [];

        // Generate comprehensive capital analytics
        const analytics = generateCapitalAnalytics(raidSeasons, members);

        return NextResponse.json(analytics);
    } catch (error) {
        console.error('Error fetching capital analytics:', error);
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

function generateCapitalAnalytics(raidSeasons: any[], members: any[]) {
    // Ensure we have valid data
    const validSeasons = Array.isArray(raidSeasons) ? raidSeasons.filter(season => season && typeof season === 'object') : [];
    const validMembers = Array.isArray(members) ? members.filter(member => member && typeof member === 'object') : [];

    // Recent raid analysis (last 8 weeks)
    const recentRaids = analyzeRecentRaids(validSeasons.slice(0, 8));
    
    // Member performance analysis
    const memberPerformance = analyzeMemberCapitalPerformance(validSeasons, validMembers);
    
    // Weekly trends and patterns
    const weeklyTrends = analyzeWeeklyTrends(validSeasons);
    
    // Capital progression tracking
    const capitalProgression = analyzeCapitalProgression(validSeasons);
    
    // Attack efficiency analysis
    const attackEfficiency = analyzeAttackEfficiency(validSeasons);

    return {
        summary: {
            totalRaids: validSeasons.length,
            averageRaidMedals: calculateAverageRaidMedals(validSeasons),
            totalCapitalGold: calculateTotalCapitalGold(validSeasons),
            activeRaiders: memberPerformance.activeRaiders.length,
            averageAttacksPerRaid: calculateAverageAttacksPerRaid(validSeasons),
            currentWeekStatus: getCurrentWeekStatus(validSeasons[0])
        },
        recentRaids,
        memberPerformance,
        weeklyTrends,
        capitalProgression,
        attackEfficiency,
        lastUpdated: new Date().toISOString()
    };
}

function analyzeRecentRaids(recentSeasons: any[]) {
    return recentSeasons.map(season => {
        if (!season) return null;

        const totalAttacks = season.members?.reduce((sum: number, member: any) => 
            sum + (member.attacks || 0), 0) || 0;
        
        const totalCapitalGold = season.members?.reduce((sum: number, member: any) => 
            sum + (member.capitalResourcesLooted || 0), 0) || 0;

        const totalRaidMedals = season.members?.reduce((sum: number, member: any) => 
            sum + (member.bonusAwardGold || 0), 0) || 0;

        const participatingMembers = season.members?.filter((member: any) => 
            member.attacks > 0).length || 0;

        return {
            endTime: season.endTime,
            state: season.state,
            totalAttacks,
            totalCapitalGold,
            totalRaidMedals,
            participatingMembers,
            averageAttacksPerMember: participatingMembers > 0 ? Number((totalAttacks / participatingMembers).toFixed(1)) : 0,
            averageGoldPerMember: participatingMembers > 0 ? Number((totalCapitalGold / participatingMembers).toFixed(0)) : 0,
            efficiency: totalAttacks > 0 ? Number((totalCapitalGold / totalAttacks).toFixed(0)) : 0
        };
    }).filter(raid => raid !== null);
}

function analyzeMemberCapitalPerformance(seasons: any[], clanMembers: any[]) {
    const memberStats: { [key: string]: any } = {};

    // Initialize member stats
    clanMembers.forEach(member => {
        memberStats[member.tag] = {
            name: member.name,
            tag: member.tag,
            role: member.role,
            capitalStats: {
                totalRaids: 0,
                totalAttacks: 0,
                totalCapitalGold: 0,
                totalRaidMedals: 0,
                averageAttacksPerRaid: 0,
                averageGoldPerRaid: 0,
                averageGoldPerAttack: 0,
                participationRate: 0,
                consistency: 0,
                recentForm: []
            }
        };
    });

    // Analyze performance across seasons
    seasons.slice(0, 12).forEach((season, seasonIndex) => {
        if (!season?.members) return;

        season.members.forEach((member: any) => {
            const playerTag = member.tag;
            if (!memberStats[playerTag]) return;

            const stats = memberStats[playerTag].capitalStats;
            
            if (member.attacks > 0) {
                stats.totalRaids++;
                stats.totalAttacks += member.attacks || 0;
                stats.totalCapitalGold += member.capitalResourcesLooted || 0;
                stats.totalRaidMedals += member.bonusAwardGold || 0;

                // Track recent form (last 8 raids)
                if (seasonIndex < 8) {
                    stats.recentForm.push({
                        seasonIndex,
                        attacks: member.attacks || 0,
                        capitalGold: member.capitalResourcesLooted || 0,
                        raidMedals: member.bonusAwardGold || 0
                    });
                }
            }
        });
    });

    // Calculate derived statistics
    Object.keys(memberStats).forEach(playerTag => {
        const stats = memberStats[playerTag].capitalStats;
        
        stats.averageAttacksPerRaid = stats.totalRaids > 0 ? Number((stats.totalAttacks / stats.totalRaids).toFixed(1)) : 0;
        stats.averageGoldPerRaid = stats.totalRaids > 0 ? Number((stats.totalCapitalGold / stats.totalRaids).toFixed(0)) : 0;
        stats.averageGoldPerAttack = stats.totalAttacks > 0 ? Number((stats.totalCapitalGold / stats.totalAttacks).toFixed(0)) : 0;
        stats.participationRate = seasons.length > 0 ? Number(((stats.totalRaids / Math.min(seasons.length, 12)) * 100).toFixed(1)) : 0;

        // Calculate consistency (based on variance in attacks per raid)
        if (stats.recentForm.length > 3) {
            const attackAvg = stats.recentForm.reduce((sum: number, raid: any) => sum + raid.attacks, 0) / stats.recentForm.length;
            const variance = stats.recentForm.reduce((sum: number, raid: any) => sum + Math.pow(raid.attacks - attackAvg, 2), 0) / stats.recentForm.length;
            stats.consistency = Number((100 - (variance * 10)).toFixed(1));
        }
    });

    // Filter active raiders and categorize
    const activeRaiders = Object.values(memberStats)
        .filter((member: any) => member.capitalStats.totalRaids > 0)
        .sort((a: any, b: any) => b.capitalStats.totalCapitalGold - a.capitalStats.totalCapitalGold);

    const topRaiders = activeRaiders.slice(0, 10);
    const consistentRaiders = activeRaiders.filter((member: any) => 
        member.capitalStats.participationRate >= 80 && member.capitalStats.totalRaids >= 4);
    const casualRaiders = activeRaiders.filter((member: any) => 
        member.capitalStats.participationRate < 50);

    return {
        activeRaiders,
        topRaiders,
        consistentRaiders,
        casualRaiders,
        overview: {
            totalActiveRaiders: activeRaiders.length,
            averageParticipationRate: activeRaiders.length > 0 ? 
                Number((activeRaiders.reduce((sum: any, member: any) => sum + member.capitalStats.participationRate, 0) / activeRaiders.length).toFixed(1)) : 0,
            consistentRaidersCount: consistentRaiders.length,
            casualRaidersCount: casualRaiders.length
        }
    };
}

function analyzeWeeklyTrends(seasons: any[]) {
    const trends = seasons.slice(0, 12).map(season => {
        if (!season) return null;

        const totalMembers = season.members?.length || 0;
        const participatingMembers = season.members?.filter((member: any) => member.attacks > 0).length || 0;
        const totalAttacks = season.members?.reduce((sum: number, member: any) => sum + (member.attacks || 0), 0) || 0;
        const totalGold = season.members?.reduce((sum: number, member: any) => sum + (member.capitalResourcesLooted || 0), 0) || 0;

        return {
            endTime: season.endTime,
            week: getWeekNumber(season.endTime),
            participationRate: totalMembers > 0 ? Number(((participatingMembers / totalMembers) * 100).toFixed(1)) : 0,
            totalAttacks,
            totalGold,
            averageGoldPerAttack: totalAttacks > 0 ? Number((totalGold / totalAttacks).toFixed(0)) : 0,
            participatingMembers
        };
    }).filter(trend => trend !== null);

    return {
        weeklyData: trends,
        trends: {
            participationTrend: calculateTrend(trends.map(t => t.participationRate)),
            goldTrend: calculateTrend(trends.map(t => t.totalGold)),
            efficiencyTrend: calculateTrend(trends.map(t => t.averageGoldPerAttack))
        }
    };
}

function analyzeCapitalProgression(seasons: any[]) {
    // Track capital level progression and district unlocks
    const progression = seasons.slice(0, 24).map(season => {
        // Note: COC API doesn't provide capital level in raid seasons
        // This would need to be inferred or tracked separately
        return {
            endTime: season.endTime,
            totalGoldEarned: season.members?.reduce((sum: number, member: any) => 
                sum + (member.capitalResourcesLooted || 0), 0) || 0,
            totalRaidMedals: season.members?.reduce((sum: number, member: any) => 
                sum + (member.bonusAwardGold || 0), 0) || 0
        };
    });

    return {
        progressionData: progression,
        totalCapitalGoldEarned: progression.reduce((sum, p) => sum + p.totalGoldEarned, 0),
        totalRaidMedalsEarned: progression.reduce((sum, p) => sum + p.totalRaidMedals, 0)
    };
}

function analyzeAttackEfficiency(seasons: any[]) {
    const efficiencyData = seasons.slice(0, 8).map(season => {
        if (!season?.members) return null;

        const attacks = season.members.flatMap((member: any) => 
            Array(member.attacks || 0).fill({
                goldPerAttack: member.attacks > 0 ? (member.capitalResourcesLooted || 0) / member.attacks : 0
            })
        );

        const totalAttacks = attacks.length;
        const averageGoldPerAttack = totalAttacks > 0 ? 
            attacks.reduce((sum: number, attack: any) => sum + attack.goldPerAttack, 0) / totalAttacks : 0;

        return {
            endTime: season.endTime,
            totalAttacks,
            averageGoldPerAttack: Number(averageGoldPerAttack.toFixed(0)),
            efficiency: averageGoldPerAttack > 1000 ? 'high' : averageGoldPerAttack > 500 ? 'medium' : 'low'
        };
    }).filter(data => data !== null);

    return {
        efficiencyData,
        overallEfficiency: efficiencyData.length > 0 ? 
            Number((efficiencyData.reduce((sum, data) => sum + data.averageGoldPerAttack, 0) / efficiencyData.length).toFixed(0)) : 0
    };
}

// Helper functions
function calculateAverageRaidMedals(seasons: any[]) {
    const totalMedals = seasons.reduce((sum, season) => {
        return sum + (season.members?.reduce((memberSum: number, member: any) => 
            memberSum + (member.bonusAwardGold || 0), 0) || 0);
    }, 0);
    return seasons.length > 0 ? Number((totalMedals / seasons.length).toFixed(0)) : 0;
}

function calculateTotalCapitalGold(seasons: any[]) {
    return seasons.reduce((sum, season) => {
        return sum + (season.members?.reduce((memberSum: number, member: any) => 
            memberSum + (member.capitalResourcesLooted || 0), 0) || 0);
    }, 0);
}

function calculateAverageAttacksPerRaid(seasons: any[]) {
    const totalAttacks = seasons.reduce((sum, season) => {
        return sum + (season.members?.reduce((memberSum: number, member: any) => 
            memberSum + (member.attacks || 0), 0) || 0);
    }, 0);
    return seasons.length > 0 ? Number((totalAttacks / seasons.length).toFixed(1)) : 0;
}

function getCurrentWeekStatus(currentSeason: any) {
    if (!currentSeason) return 'No active raid';
    
    return {
        state: currentSeason.state || 'unknown',
        endTime: currentSeason.endTime,
        participants: currentSeason.members?.filter((member: any) => member.attacks > 0).length || 0,
        totalAttacks: currentSeason.members?.reduce((sum: number, member: any) => sum + (member.attacks || 0), 0) || 0
    };
}

function getWeekNumber(dateString: string) {
    const date = new Date(dateString);
    const start = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + start.getDay() + 1) / 7);
}

function calculateTrend(values: number[]) {
    if (values.length < 2) return 'insufficient_data';
    
    const recent = values.slice(0, 3).reduce((sum, val) => sum + val, 0) / Math.min(3, values.length);
    const older = values.slice(-3).reduce((sum, val) => sum + val, 0) / Math.min(3, values.slice(-3).length);
    
    const diff = recent - older;
    return diff > 5 ? 'improving' : diff < -5 ? 'declining' : 'stable';
} 