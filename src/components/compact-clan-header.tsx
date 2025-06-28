'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Users, Trophy, Shield, GitCommit, Award, ArrowUpCircle, BarChart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function CompactClanHeader({ pulseStats, clanStats }: { pulseStats: any, clanStats: any }) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <Card className="mb-6 overflow-hidden">
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Image src={pulseStats.badgeUrl} alt="Clan Badge" width={48} height={48} />
                        <div>
                            <h3 className="text-lg font-bold">
                                {pulseStats.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">Level {pulseStats.level} • {pulseStats.warLeague}</p>
                        </div>
                    </div>
                     <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)}>
                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </Button>
                </div>

                <div className={cn("transition-all duration-300 ease-in-out overflow-hidden",
                    isExpanded ? "max-h-screen mt-4 pt-4 border-t border-border" : "max-h-0"
                )}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /> <span>{pulseStats.members} / 50 Members</span></div>
                        <div className="flex items-center gap-2"><Trophy className="h-4 w-4 text-muted-foreground" /> <span>{clanStats.clanPoints} Points</span></div>
                        <div className="flex items-center gap-2"><GitCommit className="h-4 w-4 text-muted-foreground" /> <span>{clanStats.clanVersusPoints} Versus</span></div>
                        <div className="flex items-center gap-2"><Award className="h-4 w-4 text-muted-foreground" /> <span>{clanStats.requiredTrophies} Required</span></div>
                        <div className="flex items-center gap-2"><ArrowUpCircle className="h-4 w-4 text-muted-foreground" /><span>{pulseStats.warWinStreak} Win Streak</span></div>
                        <div className="flex items-center gap-2"><BarChart className="h-4 w-4 text-muted-foreground" /><span>{pulseStats.donationRatio.toFixed(2)} Ratio</span></div>
                        <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-muted-foreground" /> <span>{clanStats.warFrequency.replace(/([A-Z])/g, ' $1').trim()}</span></div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
} 