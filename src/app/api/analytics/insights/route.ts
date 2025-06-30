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
        const [clanInfo, warLog] = await Promise.all([
            getClanInfo(clanTag),
            getClanWarLog(clanTag)
        ]);

        const members = clanInfo.memberList || [];
        const wars = warLog?.items?.slice(0, 20) || [];

        // Advanced Analytics & Insights
        const insights = generateAdvancedInsights(members, wars, clanInfo);
        
        return NextResponse.json(insights);
    } catch (error) {
        console.error('Error fetching insights:', error);
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

function generateAdvancedInsights(members: any[], wars: any[], clanInfo: any) {
    // Member Performance Analysis
    const memberInsights = analyzeMemberPerformance(members);
    
    // War Strategy Analysis
    const warInsights = analyzeWarStrategy(wars);
    
    // Clan Health Analysis
    const healthInsights = analyzeClanHealth(members, wars, clanInfo);
    
    // Predictive Analytics
    const predictions = generatePredictions(members, wars);
    
    // Recommendations
    const recommendations = generateRecommendations(members, wars, clanInfo);

    return {
        memberInsights,
        warInsights,
        healthInsights,
        predictions,
        recommendations,
        generatedAt: new Date().toISOString()
    };
}

function analyzeMemberPerformance(members: any[]) {
    const totalMembers = members.length;
    
    // Activity patterns
    const activeMembers = members.filter(m => (m.donations + m.donationsReceived) > 0);
    const activityRate = (activeMembers.length / totalMembers) * 100;
    
    // Donation patterns
    const totalDonations = members.reduce((sum, m) => sum + m.donations, 0);
    const totalReceived = members.reduce((sum, m) => sum + m.donationsReceived, 0);
    const donationBalance = totalDonations / totalReceived;
    
    // Trophy distribution analysis
    const avgTrophies = members.reduce((sum, m) => sum + m.trophies, 0) / totalMembers;
    const trophyStdDev = Math.sqrt(
        members.reduce((sum, m) => sum + Math.pow(m.trophies - avgTrophies, 2), 0) / totalMembers
    );
    
    // Identify outliers (members significantly above/below average)
    const highPerformers = members.filter(m => m.trophies > avgTrophies + trophyStdDev);
    const lowPerformers = members.filter(m => m.trophies < avgTrophies - trophyStdDev);
    
    // Role distribution analysis
    const roleDistribution = members.reduce((acc: any, m) => {
        acc[m.role] = (acc[m.role] || 0) + 1;
        return acc;
    }, {});
    
    // Identify potential promotion candidates
    const promotionCandidates = members.filter(m => 
        m.role === 'member' && 
        m.donations > avgTrophies * 0.1 && 
        m.trophies > avgTrophies * 0.9
    );

    return {
        activityRate: Math.round(activityRate),
        donationBalance: Number(donationBalance.toFixed(2)),
        trophyConsistency: Math.round(100 - (trophyStdDev / avgTrophies) * 100),
        highPerformers: highPerformers.length,
        lowPerformers: lowPerformers.length,
        promotionCandidates: promotionCandidates.map(m => ({
            name: m.name,
            tag: m.tag,
            trophies: m.trophies,
            donations: m.donations,
            reason: 'High activity and trophy count'
        })),
        inactiveMembers: members.filter(m => 
            m.donations === 0 && m.donationsReceived === 0
        ).map(m => ({
            name: m.name,
            tag: m.tag,
            daysInactive: 'Unknown', // Would need historical data
            lastSeen: 'Unknown'
        }))
    };
}

function analyzeWarStrategy(wars: any[]) {
    if (wars.length === 0) return null;
    
    const recentWars = wars.slice(0, 10);
    const wins = recentWars.filter(w => w.result === 'win').length;
    const winRate = (wins / recentWars.length) * 100;
    
    // Analyze war patterns
    const warSizes = recentWars.reduce((acc: any, w) => {
        acc[w.teamSize] = (acc[w.teamSize] || 0) + 1;
        return acc;
    }, {});
    
    const mostCommonWarSize = Object.entries(warSizes)
        .sort(([,a], [,b]) => (b as number) - (a as number))[0];
    
    // Performance by war size
    const performanceBySize = Object.entries(warSizes).map(([size, count]) => {
        const sizeWars = recentWars.filter(w => w.teamSize === parseInt(size));
        const sizeWins = sizeWars.filter(w => w.result === 'win').length;
        return {
            size: parseInt(size),
            count,
            winRate: (sizeWins / sizeWars.length) * 100
        };
    });
    
    // Attack efficiency analysis
    const avgStarEfficiency = recentWars.reduce((sum, w) => {
        return sum + (w.clan.attacks > 0 ? w.clan.stars / w.clan.attacks : 0);
    }, 0) / recentWars.length;
    
    // Identify trends
    const recentWinRate = recentWars.slice(0, 5).filter(w => w.result === 'win').length / 5 * 100;
    const earlierWinRate = recentWars.slice(5, 10).filter(w => w.result === 'win').length / 5 * 100;
    const trend = recentWinRate > earlierWinRate ? 'improving' : 
                  recentWinRate < earlierWinRate ? 'declining' : 'stable';

    return {
        overallWinRate: Math.round(winRate),
        trend,
        mostCommonWarSize: mostCommonWarSize ? parseInt(mostCommonWarSize[0]) : null,
        performanceBySize,
        avgStarEfficiency: Number(avgStarEfficiency.toFixed(2)),
        perfectWars: recentWars.filter(w => w.clan.stars === w.teamSize * 3).length,
        closeWars: recentWars.filter(w => 
            Math.abs(w.clan.stars - w.opponent.stars) <= 2
        ).length
    };
}

function analyzeClanHealth(members: any[], wars: any[], clanInfo: any) {
    const totalMembers = members.length;
    const maxMembers = 50;
    
    // Capacity analysis
    const membershipRate = (totalMembers / maxMembers) * 100;
    
    // Activity health
    const activeMembers = members.filter(m => (m.donations + m.donationsReceived) > 0).length;
    const activityHealth = (activeMembers / totalMembers) * 100;
    
    // Donation health
    const totalDonations = members.reduce((sum, m) => sum + m.donations, 0);
    const avgDonationsPerMember = totalDonations / totalMembers;
    const donationHealth = Math.min(100, (avgDonationsPerMember / 1000) * 100); // Assuming 1000 is excellent
    
    // War participation (if we have recent wars)
    let warHealth = 0;
    if (wars.length > 0) {
        const recentWar = wars[0];
        const warParticipation = (recentWar.teamSize / totalMembers) * 100;
        warHealth = Math.min(100, warParticipation);
    }
    
    // Overall health score
    const overallHealth = (activityHealth * 0.3 + donationHealth * 0.3 + warHealth * 0.2 + membershipRate * 0.2);
    
    return {
        overallScore: Math.round(overallHealth),
        membership: {
            current: totalMembers,
            capacity: maxMembers,
            utilizationRate: Math.round(membershipRate)
        },
        activity: {
            activeMembers,
            activityRate: Math.round(activityHealth),
            status: activityHealth > 80 ? 'excellent' : activityHealth > 60 ? 'good' : 'needs_improvement'
        },
        donations: {
            avgPerMember: Math.round(avgDonationsPerMember),
            health: Math.round(donationHealth),
            status: donationHealth > 80 ? 'excellent' : donationHealth > 60 ? 'good' : 'needs_improvement'
        },
        wars: {
            participationRate: Math.round(warHealth),
            status: warHealth > 80 ? 'excellent' : warHealth > 60 ? 'good' : 'needs_improvement'
        }
    };
}

function generatePredictions(members: any[], wars: any[]) {
    // Trophy progression prediction
    const avgTrophies = members.reduce((sum, m) => sum + m.trophies, 0) / members.length;
    const trophyGrowthPotential = members.filter(m => m.trophies < avgTrophies * 1.2).length;
    
    // War performance prediction
    let nextWarWinProbability = 50; // Default
    if (wars.length >= 5) {
        const recentWinRate = wars.slice(0, 5).filter(w => w.result === 'win').length / 5;
        nextWarWinProbability = Math.round(recentWinRate * 100);
    }
    
    // Membership prediction
    const inactiveMembers = members.filter(m => 
        m.donations === 0 && m.donationsReceived === 0
    ).length;
    const membershipStability = Math.max(0, 100 - (inactiveMembers / members.length) * 100);

    return {
        trophyGrowth: {
            potential: trophyGrowthPotential,
            timeframe: '1-2 weeks',
            confidence: 75
        },
        nextWarWin: {
            probability: nextWarWinProbability,
            confidence: wars.length >= 5 ? 80 : 60
        },
        membershipStability: {
            score: Math.round(membershipStability),
            riskLevel: membershipStability > 80 ? 'low' : membershipStability > 60 ? 'medium' : 'high'
        }
    };
}

function generateRecommendations(members: any[], wars: any[], clanInfo: any) {
    const recommendations = [];
    
    // Member management recommendations
    const inactiveCount = members.filter(m => 
        m.donations === 0 && m.donationsReceived === 0
    ).length;
    
    if (inactiveCount > members.length * 0.2) {
        recommendations.push({
            type: 'member_management',
            priority: 'high',
            title: 'Address Member Inactivity',
            description: `${inactiveCount} members appear inactive. Consider removing inactive members and recruiting active players.`,
            action: 'Review inactive members and consider clan cleanup'
        });
    }
    
    // Donation recommendations
    const totalDonations = members.reduce((sum, m) => sum + m.donations, 0);
    const totalReceived = members.reduce((sum, m) => sum + m.donationsReceived, 0);
    const donationRatio = totalDonations / totalReceived;
    
    if (donationRatio < 0.8) {
        recommendations.push({
            type: 'donations',
            priority: 'medium',
            title: 'Improve Donation Balance',
            description: 'Clan donation ratio is below optimal. Encourage more donations from members.',
            action: 'Set donation requirements and track member contributions'
        });
    }
    
    // War recommendations
    if (wars.length >= 3) {
        const winRate = wars.slice(0, 5).filter(w => w.result === 'win').length / Math.min(5, wars.length);
        
        if (winRate < 0.6) {
            recommendations.push({
                type: 'war_strategy',
                priority: 'high',
                title: 'Improve War Performance',
                description: `Current win rate is ${Math.round(winRate * 100)}%. Focus on attack strategies and coordination.`,
                action: 'Review war attack strategies and provide member guidance'
            });
        }
    }
    
    // Growth recommendations
    if (members.length < 45) {
        recommendations.push({
            type: 'growth',
            priority: 'medium',
            title: 'Recruit New Members',
            description: `Clan has ${members.length}/50 members. Recruiting more active players will strengthen the clan.`,
            action: 'Actively recruit in global chat and through clan search'
        });
    }
    
    // Promotion recommendations
    const eligibleForPromotion = members.filter(m => 
        m.role === 'member' && 
        m.donations > 100 && 
        m.trophies > members.reduce((sum, mem) => sum + mem.trophies, 0) / members.length * 0.9
    );
    
    if (eligibleForPromotion.length > 0) {
        recommendations.push({
            type: 'leadership',
            priority: 'low',
            title: 'Consider Member Promotions',
            description: `${eligibleForPromotion.length} members may be eligible for promotion based on activity and performance.`,
            action: 'Review active members for potential Elder promotions'
        });
    }

    return recommendations.sort((a, b) => {
        const priorityOrder: Record<string, number> = { 'high': 3, 'medium': 2, 'low': 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
} 