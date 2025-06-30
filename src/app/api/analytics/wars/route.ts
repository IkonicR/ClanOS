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
        const [clanInfo, warLog, currentWar] = await Promise.all([
            getClanInfo(clanTag),
            getClanWarLog(clanTag),
            getCurrentWar(clanTag).catch(() => null)
        ]);

        const wars = warLog?.items || [];
        const members = clanInfo?.memberList || [];

        // Enhanced War Analytics with Player Performance
        const analytics = generateAdvancedWarAnalytics(wars, members, currentWar);

        return NextResponse.json(analytics);
    } catch (error) {
        console.error('Error fetching war analytics:', error);
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

function generateAdvancedWarAnalytics(wars: any[], members: any[], currentWar: any) {
    // Ensure we have valid data arrays
    const validWars = Array.isArray(wars) ? wars.filter(war => war && typeof war === 'object') : [];
    const validMembers = Array.isArray(members) ? members.filter(member => member && typeof member === 'object') : [];
    
    // Basic war statistics
    const totalWars = validWars.length;
    const wins = validWars.filter((war: any) => war.result === 'win').length;
    const losses = validWars.filter((war: any) => war.result === 'lose').length;
    const ties = validWars.filter((war: any) => war.result === 'tie').length;
    const winRate = totalWars > 0 ? Number(((wins / totalWars) * 100).toFixed(1)) : 0;

    // Player Performance Analysis
    const playerPerformance = analyzePlayerWarPerformance(validWars, validMembers);
    
    // War Pattern Analysis
    const warPatterns = analyzeWarPatterns(validWars);
    
    // Attack Success Analysis
    const attackAnalysis = analyzeAttackSuccess(validWars);
    
    // Historical Trends
    const historicalTrends = analyzeHistoricalTrends(validWars);
    
    // Current War Analysis
    const currentWarAnalysis = analyzeCurrentWar(currentWar);
    
    // Performance Predictions
    const predictions = generateWarPredictions(validWars, playerPerformance);

    return {
        summary: {
            totalWars,
            wins,
            losses,
            ties,
            winRate,
            perfectWars: warPatterns.perfectWars,
            perfectWarRate: warPatterns.perfectWarRate,
            averageStars: warPatterns.averageStars,
            averageDestruction: warPatterns.averageDestruction
        },
        playerPerformance,
        warPatterns,
        attackAnalysis,
        historicalTrends,
        currentWar: currentWarAnalysis,
        predictions,
        recentWars: analyzeRecentWars(validWars.slice(0, 10)),
        lastUpdated: new Date().toISOString()
    };
}

function analyzePlayerWarPerformance(wars: any[], members: any[]) {
    const playerStats: { [key: string]: any } = {};
    let totalWarParticipations = 0;

    // Initialize player stats
    members.forEach(member => {
        playerStats[member.tag] = {
            name: member.name,
            tag: member.tag,
            role: member.role,
            townHallLevel: member.townHallLevel,
            trophies: member.trophies,
            warStats: {
                warsParticipated: 0,
                totalAttacks: 0,
                starsEarned: 0,
                totalDestruction: 0,
                perfectAttacks: 0,
                failedAttacks: 0,
                avgStarsPerAttack: 0,
                avgDestructionPerAttack: 0,
                successRate: 0,
                consistencyScore: 0,
                improvement: 0
            },
            recentForm: []
        };
    });

    // Analyze war performances
    wars.slice(0, 20).forEach((war, warIndex) => {
        if (!war.clan?.members) return;
        
        war.clan.members.forEach((member: any) => {
            const playerTag = member.tag;
            if (!playerStats[playerTag]) return;

            const stats = playerStats[playerTag].warStats;
            stats.warsParticipated++;
            totalWarParticipations++;

            // Analyze each attack
            if (member.attacks && Array.isArray(member.attacks)) {
                member.attacks.forEach((attack: any) => {
                    if (!attack) return; // Skip null attacks
                    
                    const stars = attack.stars || 0;
                    const destruction = attack.destructionPercentage || 0;
                    
                    stats.totalAttacks++;
                    stats.starsEarned += stars;
                    stats.totalDestruction += destruction;

                    // Perfect attack (3 stars or 100% destruction)
                    if (stars === 3 || destruction === 100) {
                        stats.perfectAttacks++;
                    }

                    // Failed attack (0 stars and low destruction)
                    if (stars === 0 && destruction < 50) {
                        stats.failedAttacks++;
                    }

                    // Track recent form (last 10 wars)
                    if (warIndex < 10) {
                        playerStats[playerTag].recentForm.push({
                            warIndex,
                            stars: stars,
                            destruction: destruction,
                            position: member.mapPosition || 0
                        });
                    }
                });
            }
        });
    });

    // Calculate derived statistics
    Object.keys(playerStats).forEach(playerTag => {
        const stats = playerStats[playerTag].warStats;
        
        if (stats.totalAttacks > 0) {
            stats.avgStarsPerAttack = Number((stats.starsEarned / stats.totalAttacks).toFixed(2));
            stats.avgDestructionPerAttack = Number((stats.totalDestruction / stats.totalAttacks).toFixed(1));
            stats.successRate = Number(((stats.perfectAttacks / stats.totalAttacks) * 100).toFixed(1));
        }

        // Calculate consistency score (based on variance in performance)
        const recentForm = playerStats[playerTag].recentForm;
        if (recentForm.length > 3) {
            const starAvg = recentForm.reduce((sum: number, attack: any) => sum + attack.stars, 0) / recentForm.length;
            const variance = recentForm.reduce((sum: number, attack: any) => sum + Math.pow(attack.stars - starAvg, 2), 0) / recentForm.length;
            stats.consistencyScore = Number((100 - (variance * 20)).toFixed(1)); // Convert to 0-100 scale
        }

        // Calculate improvement trend (recent vs older performance)
        if (recentForm.length >= 6) {
            const recentAvg = recentForm.slice(0, 3).reduce((sum: number, attack: any) => sum + attack.stars, 0) / 3;
            const olderAvg = recentForm.slice(3, 6).reduce((sum: number, attack: any) => sum + attack.stars, 0) / 3;
            stats.improvement = Number(((recentAvg - olderAvg) * 100).toFixed(1));
        }
    });

    // Filter out players with no war participation and sort by performance
    const activeWarriors = Object.values(playerStats)
        .filter((player: any) => player.warStats.warsParticipated > 0)
        .sort((a: any, b: any) => b.warStats.avgStarsPerAttack - a.warStats.avgStarsPerAttack);

    // Top and bottom performers
    const topPerformers = activeWarriors.slice(0, 5);
    const strugglingPlayers = activeWarriors
        .filter((player: any) => player.warStats.totalAttacks >= 5)
        .slice(-5);

    // Performance tiers
    const eliteWarriors = activeWarriors.filter((player: any) => 
        player.warStats.avgStarsPerAttack >= 2.5 && player.warStats.warsParticipated >= 5
    );
    const reliableWarriors = activeWarriors.filter((player: any) => 
        player.warStats.avgStarsPerAttack >= 2.0 && player.warStats.avgStarsPerAttack < 2.5
    );
    const improvingWarriors = activeWarriors.filter((player: any) => 
        player.warStats.improvement > 20 && player.warStats.warsParticipated >= 3
    );

    return {
        overview: {
            totalActiveWarriors: activeWarriors.length,
            averageParticipationRate: totalWarParticipations > 0 ? Number(((totalWarParticipations / wars.length) / members.length * 100).toFixed(1)) : 0,
            eliteCount: eliteWarriors.length,
            reliableCount: reliableWarriors.length,
            improvingCount: improvingWarriors.length
        },
        topPerformers,
        strugglingPlayers,
        performanceTiers: {
            elite: eliteWarriors,
            reliable: reliableWarriors,
            improving: improvingWarriors
        },
        allPlayers: activeWarriors
    };
}

function analyzeWarPatterns(wars: any[]) {
    let totalStars = 0;
    let totalDestruction = 0;
    let perfectWars = 0;
    let closeWars = 0;
    let dominantWins = 0;
    let crushingDefeats = 0;

    const warSizeDistribution: { [key: number]: number } = {};
    const opponentLevels: number[] = [];

    wars.forEach(war => {
        if (!war || !war.clan || !war.opponent) return;

        const ourStars = war.clan.stars || 0;
        const theirStars = war.opponent.stars || 0;
        const ourDestruction = war.clan.destructionPercentage || 0;
        const maxStars = war.teamSize ? war.teamSize * 3 : 0;

        totalStars += ourStars;
        totalDestruction += ourDestruction;

        // Perfect war (all 3 stars)
        if (ourStars === maxStars) perfectWars++;

        // Close wars (star difference <= 3)
        const starDifference = Math.abs(ourStars - theirStars);
        if (starDifference <= 3) closeWars++;

        // Dominant wins (won by 10+ stars)
        if (war.result === 'win' && (ourStars - theirStars) >= 10) dominantWins++;

        // Crushing defeats (lost by 10+ stars)
        if (war.result === 'lose' && (theirStars - ourStars) >= 10) crushingDefeats++;

        // War size tracking
        warSizeDistribution[war.teamSize] = (warSizeDistribution[war.teamSize] || 0) + 1;

        // Opponent strength tracking
        if (war.opponent.clanLevel) {
            opponentLevels.push(war.opponent.clanLevel);
        }
    });

    const avgOpponentLevel = opponentLevels.length > 0 ? 
        Number((opponentLevels.reduce((sum, level) => sum + level, 0) / opponentLevels.length).toFixed(1)) : 0;

    return {
        averageStars: wars.length > 0 ? Number((totalStars / wars.length).toFixed(1)) : 0,
        averageDestruction: wars.length > 0 ? Number((totalDestruction / wars.length).toFixed(1)) : 0,
        perfectWars,
        perfectWarRate: wars.length > 0 ? Number(((perfectWars / wars.length) * 100).toFixed(1)) : 0,
        closeWars,
                 dominantWins,
         crushingDefeats,
         warSizeDistribution,
         avgOpponentLevel,
         competitiveness: {
            closeWarRate: wars.length > 0 ? Number(((closeWars / wars.length) * 100).toFixed(1)) : 0,
            dominanceRate: wars.length > 0 ? Number(((dominantWins / wars.length) * 100).toFixed(1)) : 0
        }
    };
}

function analyzeAttackSuccess(wars: any[]) {
    let totalAttacks = 0;
    let perfectAttacks = 0;
    let goodAttacks = 0; // 2+ stars
    let failedAttacks = 0; // 0 stars
    
    const attacksByPosition: { [key: number]: { attempts: number, success: number, stars: number } } = {};
    const attackPatterns: { [key: string]: number } = {};

    wars.slice(0, 15).forEach(war => {
        if (!war.clan?.members) return;

        war.clan.members.forEach((member: any) => {
            if (!member.attacks) return;

            member.attacks.forEach((attack: any) => {
                totalAttacks++;
                
                if (attack.stars === 3) perfectAttacks++;
                else if (attack.stars >= 2) goodAttacks++;
                else if (attack.stars === 0) failedAttacks++;

                // Track attacks by map position
                const position = member.mapPosition;
                if (!attacksByPosition[position]) {
                    attacksByPosition[position] = { attempts: 0, success: 0, stars: 0 };
                }
                attacksByPosition[position].attempts++;
                attacksByPosition[position].stars += attack.stars;
                if (attack.stars >= 2) attacksByPosition[position].success++;

                // Attack patterns (who attacks whom)
                const attackerPos = member.mapPosition;
                const defenderPos = attack.defenderTag; // This might need adjustment based on API
                const pattern = `${attackerPos}vs${defenderPos}`;
                attackPatterns[pattern] = (attackPatterns[pattern] || 0) + 1;
            });
        });
    });

    const successRate = totalAttacks > 0 ? Number(((perfectAttacks / totalAttacks) * 100).toFixed(1)) : 0;
    const goodAttackRate = totalAttacks > 0 ? Number((((perfectAttacks + goodAttacks) / totalAttacks) * 100).toFixed(1)) : 0;

    return {
        overall: {
            totalAttacks,
            perfectAttacks,
            goodAttacks,
            failedAttacks,
            successRate,
            goodAttackRate,
            averageStarsPerAttack: totalAttacks > 0 ? Number(((perfectAttacks * 3 + goodAttacks * 2) / totalAttacks).toFixed(2)) : 0
        },
        byPosition: Object.entries(attacksByPosition).map(([position, stats]) => ({
            position: parseInt(position),
            attempts: stats.attempts,
            successRate: stats.attempts > 0 ? Number(((stats.success / stats.attempts) * 100).toFixed(1)) : 0,
            avgStars: stats.attempts > 0 ? Number((stats.stars / stats.attempts).toFixed(2)) : 0
        })).sort((a, b) => a.position - b.position)
    };
}

function analyzeHistoricalTrends(wars: any[]) {
    const monthlyData: { [key: string]: any } = {};
    const now = new Date();
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toISOString().substring(0, 7);
        monthlyData[monthKey] = {
            month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            wars: 0,
            wins: 0,
            losses: 0,
            ties: 0,
            stars: 0,
            destruction: 0,
            winRate: 0,
            avgStars: 0,
            trend: 'stable'
        };
    }

    wars.forEach((war: any) => {
        if (!war.endTime) return;
        
        const warDate = new Date(war.endTime);
        if (isNaN(warDate.getTime())) return;
        
        const monthKey = warDate.toISOString().substring(0, 7);
        
        if (monthlyData[monthKey]) {
            const data = monthlyData[monthKey];
            data.wars++;
            if (war.result === 'win') data.wins++;
            else if (war.result === 'lose') data.losses++;
            else data.ties++;
            data.stars += war.clan?.stars || 0;
            data.destruction += war.clan?.destructionPercentage || 0;
        }
    });

    // Calculate averages and trends
    const months = Object.keys(monthlyData).sort();
    months.forEach((month, index) => {
        const data = monthlyData[month];
        if (data.wars > 0) {
            data.winRate = Number(((data.wins / data.wars) * 100).toFixed(1));
            data.avgStars = Number((data.stars / data.wars).toFixed(1));
            data.avgDestruction = Number((data.destruction / data.wars).toFixed(1));

            // Calculate trend compared to previous month
            if (index > 0) {
                const prevMonth = monthlyData[months[index - 1]];
                if (prevMonth.wars > 0) {
                    const winRateDiff = data.winRate - prevMonth.winRate;
                    data.trend = winRateDiff > 5 ? 'improving' : winRateDiff < -5 ? 'declining' : 'stable';
                }
            }
        }
    });

    return {
        monthlyPerformance: Object.values(monthlyData),
        trends: {
            overallTrend: calculateOverallTrend(Object.values(monthlyData)),
            bestMonth: findBestMonth(Object.values(monthlyData)),
            worstMonth: findWorstMonth(Object.values(monthlyData))
        }
    };
}

function analyzeCurrentWar(currentWar: any) {
    if (!currentWar || currentWar.state === 'notInWar') {
        return null;
    }

    const ourClan = currentWar.clan;
    const opponent = currentWar.opponent;
    const maxStars = currentWar.teamSize * 3;
    
    const totalAttacksUsed = ourClan.attacks || 0;
    const maxPossibleAttacks = currentWar.teamSize * 2;
    const attacksRemaining = maxPossibleAttacks - totalAttacksUsed;
    
    const starDifference = ourClan.stars - opponent.stars;
    const destructionDifference = ourClan.destructionPercentage - opponent.destructionPercentage;
    
    // Win probability calculation
    const starsNeeded = Math.max(0, (opponent.stars + 1) - ourClan.stars);
    const winProbability = calculateWinProbability(starDifference, destructionDifference, attacksRemaining);

    return {
        state: currentWar.state,
        teamSize: currentWar.teamSize,
        timeRemaining: calculateTimeRemaining(currentWar.endTime),
        our: {
            name: ourClan.name,
            stars: ourClan.stars,
            destruction: ourClan.destructionPercentage,
            attacks: totalAttacksUsed,
            attacksRemaining,
            starEfficiency: totalAttacksUsed > 0 ? Number((ourClan.stars / totalAttacksUsed).toFixed(2)) : 0
        },
        opponent: {
            name: opponent.name,
            tag: opponent.tag,
            level: opponent.clanLevel,
            stars: opponent.stars,
            destruction: opponent.destructionPercentage,
            attacks: opponent.attacks || 0
        },
        status: {
            starDifference,
            destructionDifference: Number(destructionDifference.toFixed(1)),
            isWinning: starDifference > 0 || (starDifference === 0 && destructionDifference > 0),
            starsNeeded,
            winProbability
        }
    };
}

function generateWarPredictions(wars: any[], playerPerformance: any) {
    if (wars.length < 5) return null;

    const recentWinRate = wars.slice(0, 10).filter(w => w.result === 'win').length / Math.min(10, wars.length) * 100;
    const overallWinRate = wars.filter(w => w.result === 'win').length / wars.length * 100;
    
    // Momentum calculation
    const momentum = recentWinRate - overallWinRate;
    
    // Form analysis
    const recentForm = wars.slice(0, 5).map(w => w.result);
    const formScore = recentForm.reduce((score, result) => {
        return score + (result === 'win' ? 20 : result === 'tie' ? 10 : 0);
    }, 0);

    return {
        nextWarWinProbability: Math.max(10, Math.min(90, recentWinRate + momentum)),
        momentum: momentum > 5 ? 'positive' : momentum < -5 ? 'negative' : 'neutral',
        formScore,
        formRating: formScore >= 80 ? 'excellent' : formScore >= 60 ? 'good' : formScore >= 40 ? 'average' : 'poor',
        recommendedStrategy: generateStrategyRecommendation(playerPerformance, recentWinRate),
        confidence: Math.min(wars.length * 10, 90)
    };
}

function analyzeRecentWars(recentWars: any[]) {
    return recentWars.map(war => {
        // More robust validation
        if (!war || !war.clan || !war.opponent) return null;
        
        const ourClan = war.clan;
        const opponent = war.opponent;
        const maxStars = war.teamSize ? war.teamSize * 3 : 0;
        
        // Handle missing or null values
        const ourStars = ourClan.stars || 0;
        const ourAttacks = ourClan.attacks || 0;
        const ourDestruction = ourClan.destructionPercentage || 0;
        const opponentStars = opponent.stars || 0;
        const opponentDestruction = opponent.destructionPercentage || 0;
        
        const starEfficiency = ourAttacks > 0 ? ourStars / ourAttacks : 0;
        const isPerfect = ourStars === maxStars && maxStars > 0;
        
        return {
            endTime: war.endTime || null,
            result: war.result || 'unknown', // Provide default value
            teamSize: war.teamSize || 0,
            opponent: {
                name: opponent.name || 'Unknown Clan',
                tag: opponent.tag || '',
                level: opponent.clanLevel || 0
            },
            performance: {
                stars: ourStars,
                maxStars,
                destruction: ourDestruction,
                attacks: ourAttacks,
                starEfficiency: Number(starEfficiency.toFixed(2)),
                isPerfect
            },
            margin: {
                stars: ourStars - opponentStars,
                destruction: Number((ourDestruction - opponentDestruction).toFixed(1))
            }
        };
    }).filter(war => war !== null);
}

// Helper functions
function calculateOverallTrend(monthlyData: any[]) {
    const validMonths = monthlyData.filter(m => m.wars > 0);
    if (validMonths.length < 2) return 'insufficient_data';
    
    const recent = validMonths.slice(-2);
    const older = validMonths.slice(0, 2);
    
    if (recent.length === 0 || older.length === 0) return 'insufficient_data';
    
    const recentAvg = recent.reduce((sum, m) => sum + m.winRate, 0) / recent.length;
    const olderAvg = older.reduce((sum, m) => sum + m.winRate, 0) / older.length;
    
    const diff = recentAvg - olderAvg;
    return diff > 10 ? 'improving' : diff < -10 ? 'declining' : 'stable';
}

function findBestMonth(monthlyData: any[]) {
    const validMonths = monthlyData.filter(m => m.wars > 0);
    return validMonths.reduce((best, current) => 
        current.winRate > best.winRate ? current : best, validMonths[0] || null);
}

function findWorstMonth(monthlyData: any[]) {
    const validMonths = monthlyData.filter(m => m.wars > 0);
    return validMonths.reduce((worst, current) => 
        current.winRate < worst.winRate ? current : worst, validMonths[0] || null);
}

function calculateTimeRemaining(endTime: string) {
    const end = new Date(endTime);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
}

function calculateWinProbability(starDiff: number, destructionDiff: number, attacksRemaining: number) {
    let probability = 50; // Base 50%
    
    // Adjust for current star difference
    probability += starDiff * 10;
    
    // Adjust for destruction difference
    probability += destructionDiff * 0.2;
    
    // Adjust for remaining attacks
    if (attacksRemaining > 5) probability += 15;
    else if (attacksRemaining > 2) probability += 5;
    else if (attacksRemaining === 0) probability -= 20;
    
    return Math.max(5, Math.min(95, Math.round(probability)));
}

function generateStrategyRecommendation(playerPerformance: any, winRate: number) {
    if (winRate > 75) {
        return 'Maintain current strategy - excellent performance';
    } else if (winRate > 50) {
        return 'Focus on attack timing and coordination';
    } else {
        const strugglingCount = playerPerformance.strugglingPlayers?.length || 0;
        if (strugglingCount > 3) {
            return 'Consider member training and strategic repositioning';
        } else {
            return 'Review attack strategies and base layouts';
        }
    }
} 