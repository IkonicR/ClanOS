import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getClanInfo, getClanWarLog } from '@/lib/coc-api';

export async function GET(request: Request) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json'; // 'json' or 'csv'
    const type = searchParams.get('type') || 'overview'; // 'overview', 'members', 'wars', 'insights'

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

        let data: any;
        let filename: string;

        switch (type) {
            case 'members':
                data = exportMemberData(members, clanInfo);
                filename = `${clanInfo.name.replace(/[^a-zA-Z0-9]/g, '_')}_members_${new Date().toISOString().split('T')[0]}`;
                break;
            case 'wars':
                data = exportWarData(wars, clanInfo);
                filename = `${clanInfo.name.replace(/[^a-zA-Z0-9]/g, '_')}_wars_${new Date().toISOString().split('T')[0]}`;
                break;
            case 'insights':
                data = exportInsightsData(members, wars, clanInfo);
                filename = `${clanInfo.name.replace(/[^a-zA-Z0-9]/g, '_')}_insights_${new Date().toISOString().split('T')[0]}`;
                break;
            default:
                data = exportOverviewData(members, wars, clanInfo);
                filename = `${clanInfo.name.replace(/[^a-zA-Z0-9]/g, '_')}_overview_${new Date().toISOString().split('T')[0]}`;
        }

        if (format === 'csv') {
            const csv = convertToCSV(data);
            return new NextResponse(csv, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="${filename}.csv"`,
                },
            });
        } else {
            return new NextResponse(JSON.stringify(data, null, 2), {
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Disposition': `attachment; filename="${filename}.json"`,
                },
            });
        }
    } catch (error) {
        console.error('Error exporting data:', error);
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

function exportMemberData(members: any[], clanInfo: any) {
    return {
        exportType: 'members',
        clanName: clanInfo.name,
        clanTag: clanInfo.tag,
        exportDate: new Date().toISOString(),
        totalMembers: members.length,
        members: members.map(member => ({
            name: member.name,
            tag: member.tag,
            role: member.role,
            expLevel: member.expLevel,
            trophies: member.trophies,
            bestTrophies: member.bestTrophies,
            donations: member.donations,
            donationsReceived: member.donationsReceived,
            townHallLevel: member.townHallLevel,
            clanRank: member.clanRank,
            previousClanRank: member.previousClanRank,
            league: member.league?.name || 'Unranked',
            clanCapitalContributions: member.playerHouse?.elements?.length || 0
        }))
    };
}

function exportWarData(wars: any[], clanInfo: any) {
    return {
        exportType: 'wars',
        clanName: clanInfo.name,
        clanTag: clanInfo.tag,
        exportDate: new Date().toISOString(),
        totalWars: wars.length,
        wars: wars.map(war => ({
            result: war.result,
            endTime: war.endTime,
            teamSize: war.teamSize,
            clanStars: war.clan.stars,
            clanDestructionPercentage: war.clan.destructionPercentage,
            clanAttacks: war.clan.attacks,
            opponentStars: war.opponent.stars,
            opponentDestructionPercentage: war.opponent.destructionPercentage,
            opponentAttacks: war.opponent.attacks,
            opponentName: war.opponent.name,
            opponentTag: war.opponent.tag
        })),
        summary: {
            wins: wars.filter(w => w.result === 'win').length,
            losses: wars.filter(w => w.result === 'lose').length,
            winRate: wars.length > 0 ? (wars.filter(w => w.result === 'win').length / wars.length) * 100 : 0
        }
    };
}

function exportInsightsData(members: any[], wars: any[], clanInfo: any) {
    const totalMembers = members.length;
    const activeMembers = members.filter(m => (m.donations + m.donationsReceived) > 0);
    const avgTrophies = members.reduce((sum, m) => sum + m.trophies, 0) / totalMembers;
    
    return {
        exportType: 'insights',
        clanName: clanInfo.name,
        clanTag: clanInfo.tag,
        exportDate: new Date().toISOString(),
        summary: {
            totalMembers,
            activeMembers: activeMembers.length,
            activityRate: (activeMembers.length / totalMembers) * 100,
            averageTrophies: Math.round(avgTrophies),
            totalDonations: members.reduce((sum, m) => sum + m.donations, 0),
            totalReceived: members.reduce((sum, m) => sum + m.donationsReceived, 0)
        },
        memberInsights: {
            topPerformers: members
                .sort((a, b) => b.trophies - a.trophies)
                .slice(0, 5)
                .map(m => ({ name: m.name, trophies: m.trophies, donations: m.donations })),
            topDonators: members
                .sort((a, b) => b.donations - a.donations)
                .slice(0, 5)
                .map(m => ({ name: m.name, donations: m.donations, trophies: m.trophies })),
            inactiveMembers: members
                .filter(m => m.donations === 0 && m.donationsReceived === 0)
                .map(m => ({ name: m.name, trophies: m.trophies, role: m.role }))
        },
        warInsights: wars.length > 0 ? {
            recentWars: wars.slice(0, 10).length,
            winRate: (wars.slice(0, 10).filter(w => w.result === 'win').length / Math.min(10, wars.length)) * 100,
            avgStarsPerWar: wars.slice(0, 10).reduce((sum, w) => sum + w.clan.stars, 0) / Math.min(10, wars.length),
            perfectWars: wars.slice(0, 10).filter(w => w.clan.stars === w.teamSize * 3).length
        } : null
    };
}

function exportOverviewData(members: any[], wars: any[], clanInfo: any) {
    return {
        exportType: 'overview',
        clanName: clanInfo.name,
        clanTag: clanInfo.tag,
        clanDescription: clanInfo.description,
        clanLevel: clanInfo.clanLevel,
        clanPoints: clanInfo.clanPoints,
        clanVersusPoints: clanInfo.clanVersusPoints,
        requiredTrophies: clanInfo.requiredTrophies,
        warFrequency: clanInfo.warFrequency,
        warWinStreak: clanInfo.warWinStreak,
        warWins: clanInfo.warWins,
        warTies: clanInfo.warTies,
        warLosses: clanInfo.warLosses,
        isWarLogPublic: clanInfo.isWarLogPublic,
        clanCapital: clanInfo.clanCapital,
        chatLanguage: clanInfo.chatLanguage,
        exportDate: new Date().toISOString(),
        memberCount: members.length,
        memberSummary: {
            totalMembers: members.length,
            leaders: members.filter(m => m.role === 'leader').length,
            coLeaders: members.filter(m => m.role === 'coLeader').length,
            elders: members.filter(m => m.role === 'elder').length,
            members: members.filter(m => m.role === 'member').length,
            totalTrophies: members.reduce((sum, m) => sum + m.trophies, 0),
            totalDonations: members.reduce((sum, m) => sum + m.donations, 0)
        },
        warSummary: wars.length > 0 ? {
            totalWarsAnalyzed: wars.length,
            wins: wars.filter(w => w.result === 'win').length,
            losses: wars.filter(w => w.result === 'lose').length,
            winRate: (wars.filter(w => w.result === 'win').length / wars.length) * 100
        } : null
    };
}

function convertToCSV(data: any): string {
    if (data.exportType === 'members' && data.members) {
        const headers = Object.keys(data.members[0]).join(',');
        const rows = data.members.map((member: any) => 
            Object.values(member).map(value => 
                typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
            ).join(',')
        );
        return `${headers}\n${rows.join('\n')}`;
    } else if (data.exportType === 'wars' && data.wars) {
        const headers = Object.keys(data.wars[0]).join(',');
        const rows = data.wars.map((war: any) => 
            Object.values(war).map(value => 
                typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
            ).join(',')
        );
        return `${headers}\n${rows.join('\n')}`;
    } else {
        // For complex nested objects, flatten them
        const flattened = flattenObject(data);
        const headers = Object.keys(flattened).join(',');
        const values = Object.values(flattened).map(value => 
            typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
        ).join(',');
        return `${headers}\n${values}`;
    }
}

function flattenObject(obj: any, prefix = ''): any {
    const flattened: any = {};
    
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const newKey = prefix ? `${prefix}.${key}` : key;
            
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                Object.assign(flattened, flattenObject(obj[key], newKey));
            } else if (Array.isArray(obj[key])) {
                flattened[newKey] = `[${obj[key].length} items]`;
            } else {
                flattened[newKey] = obj[key];
            }
        }
    }
    
    return flattened;
} 