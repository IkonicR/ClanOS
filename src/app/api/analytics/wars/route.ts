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

        // Generate comprehensive war analytics
        const analytics = generateComprehensiveWarAnalytics(wars, members, currentWar);

        return NextResponse.json(analytics);
    } catch (error) {
        console.error('Error fetching war analytics:', error);
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

function generateComprehensiveWarAnalytics(wars: any[], members: any[], currentWar: any) {
    // Ensure we have valid data arrays
    const validWars = Array.isArray(wars) ? wars.filter(war => war && typeof war === 'object') : [];
    const validMembers = Array.isArray(members) ? members.filter(member => member && typeof member === 'object') : [];
    
    // Core analytics functions
    const summary = generateWarSummary(validWars);
    const memberPerformance = analyzeMemberWarPerformance(validWars, validMembers);
    const attackHistories = generateMemberAttackHistories(validWars, validMembers);
    const weeklyTrends = analyzeWeeklyWarTrends(validWars);
    const attackPatterns = analyzeAdvancedAttackPatterns(validWars);
    const competitiveAnalysis = analyzeCompetitivePerformance(validWars);
    const currentWarAnalysis = analyzeCurrentWar(currentWar);
    const predictions = generateAdvancedPredictions(validWars, memberPerformance);
    const strategicInsights = generateStrategicInsights(validWars, memberPerformance, attackPatterns);

    return {
        summary,
        memberPerformance,
        attackHistories,
        weeklyTrends,
        attackPatterns,
        competitiveAnalysis,
        currentWar: currentWarAnalysis,
        predictions,
        strategicInsights,
        recentWars: analyzeRecentWars(validWars.slice(0, 10)),
        lastUpdated: new Date().toISOString()
    };
}

// ===== CORE ANALYTICS FUNCTIONS =====

function generateWarSummary(wars: any[]) {
    const totalWars = wars.length;
    const wins = wars.filter(w => w.result === 'win').length;
    const losses = wars.filter(w => w.result === 'lose').length;
    const ties = wars.filter(w => w.result === 'tie').length;
    const winRate = totalWars > 0 ? Number(((wins / totalWars) * 100).toFixed(1)) : 0;

    // Perfect wars analysis
    const perfectWars = wars.filter(w => {
        const maxStars = w.teamSize ? w.teamSize * 3 : 0;
        return w.clan?.stars === maxStars && maxStars > 0;
    }).length;
    const perfectWarRate = totalWars > 0 ? Number(((perfectWars / totalWars) * 100).toFixed(1)) : 0;

    // Recent form (last 10 wars)
    const recentWars = wars.slice(0, 10);
    const recentWins = recentWars.filter(w => w.result === 'win').length;
    const recentWinRate = recentWars.length > 0 ? Number(((recentWins / recentWars.length) * 100).toFixed(1)) : 0;

    // Performance metrics
    const totalStars = wars.reduce((sum, w) => sum + (w.clan?.stars || 0), 0);
    const totalDestruction = wars.reduce((sum, w) => sum + (w.clan?.destructionPercentage || 0), 0);
    const averageStars = totalWars > 0 ? Number((totalStars / totalWars).toFixed(1)) : 0;
    const averageDestruction = totalWars > 0 ? Number((totalDestruction / totalWars).toFixed(1)) : 0;

    return {
        totalWars,
        wins,
        losses,
        ties,
        winRate,
        recentWinRate,
        perfectWars,
        perfectWarRate,
        averageStars,
        averageDestruction,
        streak: calculateCurrentStreak(wars),
        longestWinStreak: calculateLongestStreak(wars, 'win'),
        form: calculateWarForm(recentWars)
    };
}

function analyzeMemberWarPerformance(wars: any[], members: any[]) {
    const memberStats: { [key: string]: any } = {};
    
    // Initialize member stats
    members.forEach(member => {
        memberStats[member.tag] = {
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
                improvement: 0,
                clutchAttacks: 0,
                cleanupAttacks: 0,
                firstAttacks: 0,
                secondAttacks: 0
            },
            recentForm: [],
            attackPatterns: {
                preferredTargets: [],
                attackTiming: [],
                positionAnalysis: {}
            },
            historicalTrends: {
                last4Weeks: [],
                last12Weeks: [],
                performance: 'stable'
            }
        };
    });

    // Analyze each war
    wars.slice(0, 30).forEach((war, warIndex) => {
        if (!war.clan?.members) return;
        
        war.clan.members.forEach((member: any) => {
            const playerTag = member.tag;
            if (!memberStats[playerTag]) return;

            const stats = memberStats[playerTag].warStats;
            const patterns = memberStats[playerTag].attackPatterns;
            
            stats.warsParticipated++;

            // Analyze each attack
            if (member.attacks && Array.isArray(member.attacks)) {
                member.attacks.forEach((attack: any, attackIndex: number) => {
                    if (!attack) return;
                    
                    const stars = attack.stars || 0;
                    const destruction = attack.destructionPercentage || 0;
                    
                    stats.totalAttacks++;
                    stats.starsEarned += stars;
                    stats.totalDestruction += destruction;

                    // Attack classification
                    if (stars === 3 || destruction === 100) {
                        stats.perfectAttacks++;
                    }
                    if (stars === 0 && destruction < 50) {
                        stats.failedAttacks++;
                    }
                    if (attackIndex === 0) {
                        stats.firstAttacks++;
                    } else {
                        stats.secondAttacks++;
                    }

                    // Clutch attack detection (3 stars when needed)
                    const warResult = war.result;
                    if (stars === 3 && (warResult === 'win' || warResult === 'tie')) {
                        stats.clutchAttacks++;
                    }

                    // Track attack patterns
                    if (attack.defenderTag) {
                        patterns.preferredTargets.push({
                            defenderTag: attack.defenderTag,
                            stars,
                            destruction,
                            warIndex
                        });
                    }

                    // Recent form tracking (last 12 wars)
                    if (warIndex < 12) {
                        memberStats[playerTag].recentForm.push({
                            warIndex,
                            stars,
                            destruction,
                            position: member.mapPosition || 0,
                            attackNumber: attackIndex + 1,
                            warResult: war.result,
                            warEndTime: war.endTime
                        });
                    }

                    // Weekly trends (group by weeks)
                    if (warIndex < 12 && war.endTime) {
                        const warDate = new Date(war.endTime);
                        if (!isNaN(warDate.getTime())) {
                            const weekIndex = Math.floor(warIndex / 2); // Roughly 2 wars per week
                            if (!memberStats[playerTag].historicalTrends.last12Weeks[weekIndex]) {
                                memberStats[playerTag].historicalTrends.last12Weeks[weekIndex] = {
                                    week: weekIndex + 1,
                                    attacks: 0,
                                    stars: 0,
                                    destruction: 0,
                                    perfectAttacks: 0
                                };
                            }
                            const weekData = memberStats[playerTag].historicalTrends.last12Weeks[weekIndex];
                            weekData.attacks++;
                            weekData.stars += stars;
                            weekData.destruction += destruction;
                            if (stars === 3) weekData.perfectAttacks++;
                        }
                    }
                });
            }
        });
    });

    // Calculate derived statistics for each member
    Object.keys(memberStats).forEach(playerTag => {
        const stats = memberStats[playerTag].warStats;
        
        if (stats.totalAttacks > 0) {
            stats.avgStarsPerAttack = Number((stats.starsEarned / stats.totalAttacks).toFixed(2));
            stats.avgDestructionPerAttack = Number((stats.totalDestruction / stats.totalAttacks).toFixed(1));
            stats.successRate = Number(((stats.perfectAttacks / stats.totalAttacks) * 100).toFixed(1));
        }

        // Calculate consistency score
        const recentForm = memberStats[playerTag].recentForm;
        if (recentForm.length >= 4) {
            const starValues = recentForm.map((f: any) => f.stars);
            const avg = starValues.reduce((sum: number, val: number) => sum + val, 0) / starValues.length;
            const variance = starValues.reduce((sum: number, val: number) => sum + Math.pow(val - avg, 2), 0) / starValues.length;
            stats.consistencyScore = Math.max(0, Number((100 - (variance * 25)).toFixed(1)));
        }

        // Calculate improvement trend
        if (recentForm.length >= 8) {
            const recentPerf = recentForm.slice(0, 4).reduce((sum: number, f: any) => sum + f.stars, 0) / 4;
            const olderPerf = recentForm.slice(4, 8).reduce((sum: number, f: any) => sum + f.stars, 0) / 4;
            stats.improvement = Number(((recentPerf - olderPerf) * 100).toFixed(1));
        }

        // Calculate weekly trends averages
        const weeklyData = memberStats[playerTag].historicalTrends.last12Weeks;
        weeklyData.forEach((week: any) => {
            if (week && week.attacks > 0) {
                week.avgStars = Number((week.stars / week.attacks).toFixed(2));
                week.avgDestruction = Number((week.destruction / week.attacks).toFixed(1));
                week.successRate = Number(((week.perfectAttacks / week.attacks) * 100).toFixed(1));
            }
        });

        // Determine performance trend
        if (weeklyData.length >= 4) {
            const recentWeeks = weeklyData.slice(0, 2).filter((w: any) => w && w.attacks > 0);
            const olderWeeks = weeklyData.slice(2, 4).filter((w: any) => w && w.attacks > 0);
            
            if (recentWeeks.length > 0 && olderWeeks.length > 0) {
                const recentAvg = recentWeeks.reduce((sum: number, w: any) => sum + w.avgStars, 0) / recentWeeks.length;
                const olderAvg = olderWeeks.reduce((sum: number, w: any) => sum + w.avgStars, 0) / olderWeeks.length;
                const diff = recentAvg - olderAvg;
                
                memberStats[playerTag].historicalTrends.performance = 
                    diff > 0.3 ? 'improving' : diff < -0.3 ? 'declining' : 'stable';
            }
        }
    });

    // Filter and categorize active warriors
    const activeWarriors = Object.values(memberStats)
        .filter((player: any) => player.warStats.warsParticipated > 0)
        .sort((a: any, b: any) => b.warStats.avgStarsPerAttack - a.warStats.avgStarsPerAttack);

    // Performance tiers
    const eliteWarriors = activeWarriors.filter((player: any) => 
        player.warStats.avgStarsPerAttack >= 2.5 && player.warStats.warsParticipated >= 5
    );
    const reliableWarriors = activeWarriors.filter((player: any) => 
        player.warStats.avgStarsPerAttack >= 2.0 && player.warStats.avgStarsPerAttack < 2.5 && player.warStats.warsParticipated >= 3
    );
    const improvingWarriors = activeWarriors.filter((player: any) => 
        player.warStats.improvement > 25 && player.warStats.warsParticipated >= 3
    );
    const consistentWarriors = activeWarriors.filter((player: any) => 
        player.warStats.consistencyScore >= 80 && player.warStats.warsParticipated >= 5
    );

    return {
        overview: {
            totalActiveWarriors: activeWarriors.length,
            eliteCount: eliteWarriors.length,
            reliableCount: reliableWarriors.length,
            improvingCount: improvingWarriors.length,
            consistentCount: consistentWarriors.length,
            averageParticipationRate: calculateParticipationRate(activeWarriors, wars.length)
        },
        topPerformers: activeWarriors.slice(0, 8),
        strugglingWarriors: activeWarriors.filter(p => p.warStats.totalAttacks >= 8).slice(-5),
        performanceTiers: {
            elite: eliteWarriors,
            reliable: reliableWarriors,
            improving: improvingWarriors,
            consistent: consistentWarriors
        },
        allWarriors: activeWarriors
    };
}

function generateMemberAttackHistories(wars: any[], members: any[]) {
    const histories: { [key: string]: any } = {};
    
    members.forEach(member => {
        histories[member.tag] = {
            name: member.name,
            tag: member.tag,
            attacks: [],
            statistics: {
                totalAttacks: 0,
                starDistribution: { 0: 0, 1: 0, 2: 0, 3: 0 },
                destructionRanges: {
                    '0-25': 0, '25-50': 0, '50-75': 0, '75-99': 0, '100': 0
                },
                attackPositions: {},
                monthlyPerformance: {}
            }
        };
    });

    wars.slice(0, 25).forEach((war, warIndex) => {
        if (!war.clan?.members || !war.endTime) return;
        
        const warDate = new Date(war.endTime);
        if (isNaN(warDate.getTime())) return;
        
        const monthKey = warDate.toISOString().substring(0, 7);
        
        war.clan.members.forEach((member: any) => {
            if (!histories[member.tag]) return;
            
            const history = histories[member.tag];
            
            if (member.attacks && Array.isArray(member.attacks)) {
                member.attacks.forEach((attack: any, attackIndex: number) => {
                    if (!attack) return;
                    
                    const attackData = {
                        warIndex,
                        warDate: war.endTime,
                        warResult: war.result,
                        teamSize: war.teamSize,
                        attackNumber: attackIndex + 1,
                        stars: attack.stars || 0,
                        destruction: attack.destructionPercentage || 0,
                        defenderTag: attack.defenderTag,
                        position: member.mapPosition || 0,
                        opponent: {
                            name: war.opponent?.name || 'Unknown',
                            level: war.opponent?.clanLevel || 0
                        }
                    };
                    
                    history.attacks.push(attackData);
                    history.statistics.totalAttacks++;
                    
                    // Update distributions
                    const stars = attackData.stars;
                    history.statistics.starDistribution[stars]++;
                    
                    const destruction = attackData.destruction;
                    if (destruction === 100) {
                        history.statistics.destructionRanges['100']++;
                    } else if (destruction >= 75) {
                        history.statistics.destructionRanges['75-99']++;
                    } else if (destruction >= 50) {
                        history.statistics.destructionRanges['50-75']++;
                    } else if (destruction >= 25) {
                        history.statistics.destructionRanges['25-50']++;
                    } else {
                        history.statistics.destructionRanges['0-25']++;
                    }
                    
                    // Position tracking
                    const pos = attackData.position;
                    if (!history.statistics.attackPositions[pos]) {
                        history.statistics.attackPositions[pos] = { attacks: 0, stars: 0 };
                    }
                    history.statistics.attackPositions[pos].attacks++;
                    history.statistics.attackPositions[pos].stars += stars;
                    
                    // Monthly performance
                    if (!history.statistics.monthlyPerformance[monthKey]) {
                        history.statistics.monthlyPerformance[monthKey] = {
                            attacks: 0, stars: 0, destruction: 0, perfectAttacks: 0
                        };
                    }
                    const monthData = history.statistics.monthlyPerformance[monthKey];
                    monthData.attacks++;
                    monthData.stars += stars;
                    monthData.destruction += destruction;
                    if (stars === 3) monthData.perfectAttacks++;
                });
            }
        });
    });

    // Calculate averages and trends for each member
    Object.keys(histories).forEach(tag => {
        const history = histories[tag];
        
        // Position performance
        Object.keys(history.statistics.attackPositions).forEach(pos => {
            const posData = history.statistics.attackPositions[pos];
            posData.avgStars = posData.attacks > 0 ? Number((posData.stars / posData.attacks).toFixed(2)) : 0;
        });
        
        // Monthly averages
        Object.keys(history.statistics.monthlyPerformance).forEach(month => {
            const monthData = history.statistics.monthlyPerformance[month];
            if (monthData.attacks > 0) {
                monthData.avgStars = Number((monthData.stars / monthData.attacks).toFixed(2));
                monthData.avgDestruction = Number((monthData.destruction / monthData.attacks).toFixed(1));
                monthData.successRate = Number(((monthData.perfectAttacks / monthData.attacks) * 100).toFixed(1));
            }
        });
    });

    return Object.values(histories).filter((h: any) => h.statistics.totalAttacks > 0);
}

function analyzeWeeklyWarTrends(wars: any[]) {
    const weeklyData: { [key: string]: any } = {};
    const now = new Date();
    
    // Initialize last 12 weeks
    for (let i = 11; i >= 0; i--) {
        const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (i * 7));
        const weekKey = getWeekKey(weekStart);
        weeklyData[weekKey] = {
            week: `Week ${12 - i}`,
            weekStart: weekStart.toISOString(),
            wars: 0,
            wins: 0,
            losses: 0,
            ties: 0,
            totalStars: 0,
            totalDestruction: 0,
            perfectWars: 0,
            attacks: 0,
            avgStars: 0,
            avgDestruction: 0,
            winRate: 0,
            performance: 'neutral'
        };
    }
    
    wars.forEach((war: any) => {
        if (!war.endTime) return;
        
        const warDate = new Date(war.endTime);
        if (isNaN(warDate.getTime())) return;
        
        const weekKey = getWeekKey(warDate);
        
        if (weeklyData[weekKey]) {
            const data = weeklyData[weekKey];
            data.wars++;
            
            if (war.result === 'win') data.wins++;
            else if (war.result === 'lose') data.losses++;
            else data.ties++;
            
            data.totalStars += war.clan?.stars || 0;
            data.totalDestruction += war.clan?.destructionPercentage || 0;
            
            // Count perfect wars
            const maxStars = war.teamSize ? war.teamSize * 3 : 0;
            if (war.clan?.stars === maxStars && maxStars > 0) {
                data.perfectWars++;
            }
            
            // Count total attacks
            if (war.clan?.members) {
                war.clan.members.forEach((member: any) => {
                    if (member.attacks) {
                        data.attacks += member.attacks.length;
                    }
                });
            }
        }
    });

    // Calculate averages and trends
    const weeks = Object.keys(weeklyData).sort();
    weeks.forEach((week, index) => {
        const data = weeklyData[week];
        if (data.wars > 0) {
            data.winRate = Number(((data.wins / data.wars) * 100).toFixed(1));
            data.avgStars = Number((data.totalStars / data.wars).toFixed(1));
            data.avgDestruction = Number((data.totalDestruction / data.wars).toFixed(1));
            
            // Performance trend
            if (index > 0) {
                const prevWeek = weeklyData[weeks[index - 1]];
                if (prevWeek.wars > 0) {
                    const winRateDiff = data.winRate - prevWeek.winRate;
                    data.performance = winRateDiff > 10 ? 'improving' : winRateDiff < -10 ? 'declining' : 'stable';
                }
            }
        }
    });

    return {
        weeklyPerformance: Object.values(weeklyData),
        trends: {
            overallTrend: calculateOverallWarTrend(Object.values(weeklyData)),
            bestWeek: findBestWeek(Object.values(weeklyData)),
            worstWeek: findWorstWeek(Object.values(weeklyData)),
            consistency: calculateWeeklyConsistency(Object.values(weeklyData))
        }
    };
}

function analyzeAdvancedAttackPatterns(wars: any[]) {
    const patterns = {
        attackTiming: { early: 0, mid: 0, late: 0 },
        positionTargeting: {},
        mirrorAttacks: 0,
        upAttacks: 0,
        downAttacks: 0,
        cleanupAttacks: 0,
        starSecuring: { onestar: 0, twostar: 0, threestar: 0 },
        townHallTargeting: {},
        attackOrder: { first: 0, second: 0 },
        successByTiming: { early: { attempts: 0, successes: 0 }, mid: { attempts: 0, successes: 0 }, late: { attempts: 0, successes: 0 } }
    };

    wars.slice(0, 20).forEach(war => {
        if (!war.clan?.members) return;
        
        const totalMembers = war.teamSize || war.clan.members.length;
        
        war.clan.members.forEach((member: any) => {
            if (!member.attacks) return;
            
            member.attacks.forEach((attack: any, attackIndex: number) => {
                if (!attack) return;
                
                const position = member.mapPosition || 0;
                const stars = attack.stars || 0;
                
                // Attack order
                if (attackIndex === 0) patterns.attackOrder.first++;
                else patterns.attackOrder.second++;
                
                // Star securing patterns
                if (stars === 1) patterns.starSecuring.onestar++;
                else if (stars === 2) patterns.starSecuring.twostar++;
                else if (stars === 3) patterns.starSecuring.threestar++;
                
                // Position-based analysis (mirror, up, down attacks)
                // This would need defender position to be fully accurate
                // For now, we'll estimate based on attack order in war
                const estimatedDefenderPosition = position; // Simplified
                
                if (estimatedDefenderPosition === position) {
                    patterns.mirrorAttacks++;
                } else if (estimatedDefenderPosition > position) {
                    patterns.downAttacks++;
                } else {
                    patterns.upAttacks++;
                }
            });
        });
    });

    return patterns;
}

function analyzeCompetitivePerformance(wars: any[]) {
    const analysis = {
        opponentAnalysis: {
            levels: {},
            sizes: {},
            strengthComparison: { stronger: 0, similar: 0, weaker: 0 }
        },
        closeWars: [],
        dominantPerformances: [],
        underperformances: [],
        clutchWins: [],
        missedOpportunities: []
    };

    wars.forEach(war => {
        if (!war.opponent || !war.clan) return;
        
        const ourStars = war.clan.stars || 0;
        const theirStars = war.opponent.stars || 0;
        const starDiff = ourStars - theirStars;
        const ourDestruction = war.clan.destructionPercentage || 0;
        const theirDestruction = war.opponent.destructionPercentage || 0;
        
        // Opponent level tracking
        const opponentLevel = war.opponent.clanLevel || 0;
        analysis.opponentAnalysis.levels[opponentLevel] = (analysis.opponentAnalysis.levels[opponentLevel] || 0) + 1;
        
        // War size tracking
        const warSize = war.teamSize || 0;
        analysis.opponentAnalysis.sizes[warSize] = (analysis.opponentAnalysis.sizes[warSize] || 0) + 1;
        
        // Strength comparison (simplified)
        // Could be enhanced with actual clan strength metrics
        if (opponentLevel > 15) analysis.opponentAnalysis.strengthComparison.stronger++;
        else if (opponentLevel < 10) analysis.opponentAnalysis.strengthComparison.weaker++;
        else analysis.opponentAnalysis.strengthComparison.similar++;
        
        // War outcome analysis
        if (Math.abs(starDiff) <= 3) {
            analysis.closeWars.push({ ...war, starDiff, destructionDiff: ourDestruction - theirDestruction });
        }
        
        if (war.result === 'win' && starDiff >= 10) {
            analysis.dominantPerformances.push(war);
        }
        
        if (war.result === 'lose' && starDiff <= -10) {
            analysis.underperformances.push(war);
        }
        
        if (war.result === 'win' && Math.abs(starDiff) <= 2) {
            analysis.clutchWins.push(war);
        }
        
        if (war.result === 'lose' && starDiff >= -3) {
            analysis.missedOpportunities.push(war);
        }
    });

    return analysis;
}

// ===== HELPER FUNCTIONS =====

function calculateCurrentStreak(wars: any[]) {
    if (wars.length === 0) return { type: 'none', count: 0 };
    
    const firstResult = wars[0].result;
    let count = 0;
    
    for (const war of wars) {
        if (war.result === firstResult) {
            count++;
        } else {
            break;
        }
    }
    
    return { type: firstResult, count };
}

function calculateLongestStreak(wars: any[], type: string) {
    let longest = 0;
    let current = 0;
    
    wars.forEach(war => {
        if (war.result === type) {
            current++;
            longest = Math.max(longest, current);
        } else {
            current = 0;
        }
    });
    
    return longest;
}

function calculateWarForm(recentWars: any[]) {
    const formPoints = recentWars.reduce((points, war) => {
        if (war.result === 'win') return points + 3;
        if (war.result === 'tie') return points + 1;
        return points;
    }, 0);
    
    const maxPoints = recentWars.length * 3;
    const formPercentage = maxPoints > 0 ? (formPoints / maxPoints) * 100 : 0;
    
    if (formPercentage >= 80) return 'excellent';
    if (formPercentage >= 60) return 'good';
    if (formPercentage >= 40) return 'average';
    return 'poor';
}

function calculateParticipationRate(activeWarriors: any[], totalWars: number) {
    if (activeWarriors.length === 0 || totalWars === 0) return 0;
    
    const totalParticipations = activeWarriors.reduce((sum, warrior) => sum + warrior.warStats.warsParticipated, 0);
    const maxPossibleParticipations = activeWarriors.length * totalWars;
    
    return maxPossibleParticipations > 0 ? Number(((totalParticipations / maxPossibleParticipations) * 100).toFixed(1)) : 0;
}

function getWeekKey(date: Date) {
    const year = date.getFullYear();
    const week = Math.floor((date.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
    return `${year}-W${week}`;
}

function calculateOverallWarTrend(weeklyData: any[]) {
    const validWeeks = weeklyData.filter(w => w.wars > 0);
    if (validWeeks.length < 3) return 'insufficient_data';
    
    const recent = validWeeks.slice(-3);
    const older = validWeeks.slice(0, 3);
    
    const recentAvg = recent.reduce((sum, w) => sum + w.winRate, 0) / recent.length;
    const olderAvg = older.reduce((sum, w) => sum + w.winRate, 0) / older.length;
    
    const diff = recentAvg - olderAvg;
    return diff > 10 ? 'improving' : diff < -10 ? 'declining' : 'stable';
}

function findBestWeek(weeklyData: any[]) {
    const validWeeks = weeklyData.filter(w => w.wars > 0);
    return validWeeks.reduce((best, current) => 
        current.winRate > best.winRate ? current : best, validWeeks[0] || null);
}

function findWorstWeek(weeklyData: any[]) {
    const validWeeks = weeklyData.filter(w => w.wars > 0);
    return validWeeks.reduce((worst, current) => 
        current.winRate < worst.winRate ? current : worst, validWeeks[0] || null);
}

function calculateWeeklyConsistency(weeklyData: any[]) {
    const validWeeks = weeklyData.filter(w => w.wars > 0);
    if (validWeeks.length < 3) return 0;
    
    const winRates = validWeeks.map(w => w.winRate);
    const avg = winRates.reduce((sum, rate) => sum + rate, 0) / winRates.length;
    const variance = winRates.reduce((sum, rate) => sum + Math.pow(rate - avg, 2), 0) / winRates.length;
    
    return Math.max(0, Number((100 - Math.sqrt(variance)).toFixed(1)));
}

function analyzeCurrentWar(currentWar: any) {
    if (!currentWar || currentWar.state === 'notInWar') {
        return null;
    }

    const ourClan = currentWar.clan;
    const opponent = currentWar.opponent;
    
    const totalAttacksUsed = ourClan.attacks || 0;
    const maxPossibleAttacks = currentWar.teamSize * 2;
    const attacksRemaining = maxPossibleAttacks - totalAttacksUsed;
    
    const starDifference = ourClan.stars - opponent.stars;
    const destructionDifference = ourClan.destructionPercentage - opponent.destructionPercentage;
    
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
            winProbability
        }
    };
}

function generateAdvancedPredictions(wars: any[], memberPerformance: any) {
    if (wars.length < 5) return null;

    const recentWinRate = wars.slice(0, 10).filter(w => w.result === 'win').length / Math.min(10, wars.length) * 100;
    const overallWinRate = wars.filter(w => w.result === 'win').length / wars.length * 100;
    
    const momentum = recentWinRate - overallWinRate;
    const recentForm = wars.slice(0, 5).map(w => w.result);
    const formScore = recentForm.reduce((score, result) => {
        return score + (result === 'win' ? 20 : result === 'tie' ? 10 : 0);
    }, 0);

    return {
        nextWarWinProbability: Math.max(10, Math.min(90, recentWinRate + momentum)),
        momentum: momentum > 5 ? 'positive' : momentum < -5 ? 'negative' : 'neutral',
        formScore,
        formRating: formScore >= 80 ? 'excellent' : formScore >= 60 ? 'good' : formScore >= 40 ? 'average' : 'poor',
        confidence: Math.min(wars.length * 8, 85)
    };
}

function generateStrategicInsights(wars: any[], memberPerformance: any, attackPatterns: any) {
    const insights = [];
    
    // Analyze attack timing
    if (attackPatterns.successByTiming) {
        const earlySuccess = attackPatterns.successByTiming.early.attempts > 0 ? 
            (attackPatterns.successByTiming.early.successes / attackPatterns.successByTiming.early.attempts) * 100 : 0;
        const lateSuccess = attackPatterns.successByTiming.late.attempts > 0 ? 
            (attackPatterns.successByTiming.late.successes / attackPatterns.successByTiming.late.attempts) * 100 : 0;
        
        if (earlySuccess > lateSuccess + 10) {
            insights.push('Early attacks show higher success rates - encourage quicker war engagement');
        }
    }
    
    // Member performance insights
    if (memberPerformance.performanceTiers.improving.length > 3) {
        insights.push('Strong improvement trend detected - current training methods are effective');
    }
    
    if (memberPerformance.strugglingWarriors.length > 2) {
        insights.push('Consider focused training for struggling members to improve overall war performance');
    }
    
    return insights;
}

function analyzeRecentWars(recentWars: any[]) {
    return recentWars.map(war => {
        if (!war || !war.clan || !war.opponent) return null;
        
        const ourClan = war.clan;
        const opponent = war.opponent;
        const maxStars = war.teamSize ? war.teamSize * 3 : 0;
        
        const ourStars = ourClan.stars || 0;
        const ourAttacks = ourClan.attacks || 0;
        const ourDestruction = ourClan.destructionPercentage || 0;
        const opponentStars = opponent.stars || 0;
        const opponentDestruction = opponent.destructionPercentage || 0;
        
        const starEfficiency = ourAttacks > 0 ? ourStars / ourAttacks : 0;
        const isPerfect = ourStars === maxStars && maxStars > 0;
        
        return {
            endTime: war.endTime || null,
            result: war.result || 'unknown',
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

function calculateTimeRemaining(endTime: string) {
    if (!endTime) return 'Unknown';
    
    const end = new Date(endTime);
    if (isNaN(end.getTime())) return 'Invalid';
    
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
}

function calculateWinProbability(starDiff: number, destructionDiff: number, attacksRemaining: number) {
    let probability = 50;
    
    probability += starDiff * 8;
    probability += destructionDiff * 0.15;
    
    if (attacksRemaining > 8) probability += 20;
    else if (attacksRemaining > 4) probability += 10;
    else if (attacksRemaining === 0) probability -= 25;
    
    return Math.max(5, Math.min(95, Math.round(probability)));
} 