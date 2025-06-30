import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getClanInfo } from '@/lib/coc-api';

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
        const clanInfo = await getClanInfo(clanTag);
        const members = clanInfo.memberList || [];

        // Enhanced member analysis
        const memberAnalytics = members.map((member: any) => {
            const donationEfficiency = member.donationsReceived > 0 ? 
                Number((member.donations / member.donationsReceived).toFixed(2)) : 
                (member.donations > 0 ? 999 : 0); // High score for givers, 0 for inactive

            // Calculate various scores
            const trophyScore = member.trophies / 100; // Normalize trophies
            const donationScore = member.donations / 100; // Normalize donations
            const activityScore = (member.donations + member.donationsReceived) / 200;
            
            // Overall performance score (weighted average)
            const performanceScore = Number((
                (trophyScore * 0.4) + 
                (donationScore * 0.3) + 
                (activityScore * 0.3)
            ).toFixed(1));

            return {
                ...member,
                donationEfficiency,
                performanceScore,
                trophyScore,
                donationScore,
                activityScore,
                isActive: (member.donations + member.donationsReceived) > 0,
                rankChange: member.previousClanRank - member.clanRank // Positive = moved up
            };
        });

        // Sort by performance score
        const sortedMembers = [...memberAnalytics].sort((a, b) => b.performanceScore - a.performanceScore);

        // Analytics summaries
        const activeMembers = memberAnalytics.filter((m: any) => m.isActive);
        const inactiveMembers = memberAnalytics.filter((m: any) => !m.isActive);

        // Performance tiers
        const topPerformers = sortedMembers.slice(0, Math.ceil(members.length * 0.2)); // Top 20%
        const midPerformers = sortedMembers.slice(
            Math.ceil(members.length * 0.2), 
            Math.ceil(members.length * 0.8)
        ); // Middle 60%
        const lowPerformers = sortedMembers.slice(Math.ceil(members.length * 0.8)); // Bottom 20%

        // Donation analysis
        const donationAnalysis = {
            totalGiven: memberAnalytics.reduce((sum: number, m: any) => sum + m.donations, 0),
            totalReceived: memberAnalytics.reduce((sum: number, m: any) => sum + m.donationsReceived, 0),
            topDonators: [...memberAnalytics]
                .sort((a: any, b: any) => b.donations - a.donations)
                .slice(0, 10),
            mostEfficient: [...memberAnalytics]
                .filter((m: any) => m.donations > 0 && m.donationsReceived > 0)
                .sort((a: any, b: any) => b.donationEfficiency - a.donationEfficiency)
                .slice(0, 10),
            inactive: inactiveMembers.length
        };

        // Trophy analysis
        const trophyRanges = {
            'Legends (5000+)': memberAnalytics.filter((m: any) => m.trophies >= 5000).length,
            'Titans (4600-4999)': memberAnalytics.filter((m: any) => m.trophies >= 4600 && m.trophies < 5000).length,
            'Champions (3200-4599)': memberAnalytics.filter((m: any) => m.trophies >= 3200 && m.trophies < 4600).length,
            'Masters (2600-3199)': memberAnalytics.filter((m: any) => m.trophies >= 2600 && m.trophies < 3200).length,
            'Crystal (2000-2599)': memberAnalytics.filter((m: any) => m.trophies >= 2000 && m.trophies < 2600).length,
            'Gold (1400-1999)': memberAnalytics.filter((m: any) => m.trophies >= 1400 && m.trophies < 2000).length,
            'Silver (800-1399)': memberAnalytics.filter((m: any) => m.trophies >= 800 && m.trophies < 1400).length,
            'Bronze (0-799)': memberAnalytics.filter((m: any) => m.trophies < 800).length
        };

        // Town Hall distribution analysis
        const thAnalysis = memberAnalytics.reduce((acc: any, member: any) => {
            const th = member.townHallLevel;
            if (!acc[th]) {
                acc[th] = {
                    count: 0,
                    avgTrophies: 0,
                    avgDonations: 0,
                    totalTrophies: 0,
                    totalDonations: 0
                };
            }
            acc[th].count++;
            acc[th].totalTrophies += member.trophies;
            acc[th].totalDonations += member.donations;
            return acc;
        }, {});

        // Calculate averages for each TH level
        Object.keys(thAnalysis).forEach(th => {
            const data = thAnalysis[th];
            data.avgTrophies = Math.round(data.totalTrophies / data.count);
            data.avgDonations = Math.round(data.totalDonations / data.count);
        });

        const result = {
            memberCount: members.length,
            activeCount: activeMembers.length,
            inactiveCount: inactiveMembers.length,
            members: sortedMembers,
            performanceTiers: {
                top: {
                    count: topPerformers.length,
                    members: topPerformers,
                    avgScore: Number((topPerformers.reduce((sum, m) => sum + m.performanceScore, 0) / topPerformers.length).toFixed(1))
                },
                mid: {
                    count: midPerformers.length,
                    avgScore: Number((midPerformers.reduce((sum, m) => sum + m.performanceScore, 0) / midPerformers.length).toFixed(1))
                },
                low: {
                    count: lowPerformers.length,
                    members: lowPerformers,
                    avgScore: Number((lowPerformers.reduce((sum, m) => sum + m.performanceScore, 0) / lowPerformers.length).toFixed(1))
                }
            },
            donationAnalysis,
            trophyRanges,
            townHallAnalysis: thAnalysis,
            lastUpdated: new Date().toISOString()
        };

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error fetching member analytics:', error);
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: message }, { status: 500 });
    }
} 