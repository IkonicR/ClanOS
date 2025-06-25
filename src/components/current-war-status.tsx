'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Swords, Star, Shield, Users, AlertTriangle, Clock, Target, ShieldCheck, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

type Urgency = 'normal' | 'high' | 'critical' | 'ended';

function parseCocDate(dateString: string): Date {
  if (!dateString || dateString.length < 15) return new Date(NaN);
  const year = dateString.substring(0, 4);
  const month = dateString.substring(4, 6);
  const day = dateString.substring(6, 8);
  const hour = dateString.substring(9, 11);
  const minute = dateString.substring(11, 13);
  const second = dateString.substring(13, 15);
  const isoString = `${year}-${month}-${day}T${hour}:${minute}:${second}.000Z`;
  const d = new Date(isoString);
  return isNaN(d.getTime()) ? new Date(NaN) : d;
}

const Countdown = ({ endTime }: { endTime: string }) => {
    const [timeLeft, setTimeLeft] = useState('');
    const [urgency, setUrgency] = useState<Urgency>('normal');

    useEffect(() => {
        const calculateTimeLeft = () => {
            const endDateTime = parseCocDate(endTime);
            if (isNaN(endDateTime.getTime())) {
                setTimeLeft("Invalid Date");
                setUrgency('ended');
                return;
            }
            const difference = +endDateTime - +new Date();
            if (difference > 0) {
                const hours = Math.floor(difference / (1000 * 60 * 60));
                const minutes = Math.floor((difference / 1000 / 60) % 60);
                const seconds = Math.floor((difference / 1000) % 60);
                setTimeLeft(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
                if (hours < 1) setUrgency('critical');
                else if (hours < 3) setUrgency('high');
                else setUrgency('normal');
            } else {
                setTimeLeft("Finished");
                setUrgency('ended');
            }
        };
        const timer = setInterval(calculateTimeLeft, 1000);
        calculateTimeLeft();
        return () => clearInterval(timer);
    }, [endTime]);

    const urgencyClasses: { [key in Urgency]: string } = {
        normal: 'text-foreground',
        high: 'text-amber-500',
        critical: 'text-red-500',
        ended: 'text-muted-foreground',
    };
    return <div className={cn("text-2xl md:text-4xl font-bold", urgencyClasses[urgency])}>{timeLeft}</div>;
};

const WarStars = ({ count }: { count: number }) => (
    <div className="flex justify-center items-center">
        {Array.from({ length: 3 }).map((_, i) => (
            <Star key={i} className={cn("h-4 w-4", i < count ? 'text-primary' : 'text-muted-foreground/50')} />
        ))}
    </div>
);

const AttackFeed = ({ attacks, userPlayerTag }: { attacks: any[], userPlayerTag?: string }) => {
    if (attacks.length === 0) {
        return <div className="text-center text-muted-foreground py-10">No attacks recorded yet.</div>
    }
    return (
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {attacks.map((attack) => {
                const isMyAttack = userPlayerTag && attack.attackerTag === userPlayerTag;
                return (
                     <div key={attack.order} className={cn(
                        "flex items-center justify-between p-2 rounded-lg bg-background/50 border-l-4 transition-all",
                        attack.clan === 'ours' ? 'border-primary' : 'border-destructive',
                        isMyAttack && 'bg-primary/20 ring-1 ring-primary'
                    )}>
                        <div className="flex flex-col items-center w-1/4">
                            <span className="text-xs text-muted-foreground">Attacker</span>
                            <span className="font-bold text-sm text-center">#{attack.attackerMapPosition} {attack.attackerName || 'Unknown'}</span>
                            <span className="text-xs text-muted-foreground">TH{attack.attackerTownhallLevel}</span>
                        </div>
                        <div className="flex flex-col items-center flex-grow text-center px-2">
                            <WarStars count={attack.stars} />
                            <span className="font-bold text-lg">{attack.destructionPercentage}%</span>
                            <div className="w-full h-1 bg-muted rounded-full mt-1">
                                <div className="h-1 bg-primary rounded-full" style={{ width: `${attack.destructionPercentage}%` }}></div>
                            </div>
                        </div>
                        <div className="flex flex-col items-center w-1/4">
                           <span className="text-xs text-muted-foreground">Defender</span>
                            <span className="font-bold text-sm text-center">#{attack.defenderMapPosition} {attack.defenderName || 'Unknown'}</span>
                            <span className="text-xs text-muted-foreground">TH{attack.defenderTownhallLevel}</span>
                        </div>
                    </div>
                )
            })}
        </div>
    );
};

const WarRoster = ({ members, opponentMembers, userPlayerTag }: { members: any[], opponentMembers: any[], userPlayerTag?: string }) => {
     const sortedMembers = useMemo(() => [...members].sort((a,b) => a.mapPosition - b.mapPosition), [members]);
    return (
        <div className="max-h-[400px] overflow-y-auto pr-2">
            <Table>
                <TableHeader><TableRow><TableHead className="w-[40px]">#</TableHead><TableHead>Player</TableHead><TableHead className="text-center">Attacks</TableHead><TableHead className="text-center">Defense</TableHead></TableRow></TableHeader>
                <TableBody>
                    {sortedMembers.map((member) => {
                        const attacksUsed = member.attacks?.length ?? 0;
                        const bestDefense = member.bestOpponentAttack;
                        const isMe = userPlayerTag && member.tag === userPlayerTag;
                        return (
                            <TableRow key={member.tag} className={cn(isMe && "bg-primary/10")}>
                                <TableCell>{member.mapPosition}</TableCell>
                                <TableCell>{member.name}</TableCell>
                                <TableCell className="text-center">
                                    <div className="flex items-center justify-center space-x-1">
                                        <TooltipProvider>
                                            <Tooltip><TooltipTrigger><Target className={cn("h-4 w-4", attacksUsed >= 1 ? "text-primary": "text-muted-foreground/50")} /></TooltipTrigger><TooltipContent>{attacksUsed >= 1 ? "First attack used" : "First attack available"}</TooltipContent></Tooltip>
                                            <Tooltip><TooltipTrigger><Target className={cn("h-4 w-4", attacksUsed >= 2 ? "text-primary": "text-muted-foreground/50")} /></TooltipTrigger><TooltipContent>{attacksUsed >= 2 ? "Second attack used" : "Second attack available"}</TooltipContent></Tooltip>
                                        </TooltipProvider>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                     <div className="flex items-center justify-center">
                                        {bestDefense ? (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger className="flex items-center gap-1">
                                                        <WarStars count={bestDefense.stars} />
                                                        <span className='text-xs'>({bestDefense.destructionPercentage}%)</span>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Attacked by {opponentMembers.find(m => m.tag === bestDefense.attackerTag)?.name || 'Unknown'}</TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        ) : <ShieldCheck className="h-4 w-4 text-green-500" />}
                                    </div>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    );
};

const CurrentWarStatus = () => {
    const [warData, setWarData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userProfile, setUserProfile] = useState<any>(null);

    const fetchWarData = useCallback(async () => {
        try {
            const res = await fetch('/api/current-war');
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to fetch war data');
            }
            const data = await res.json();
            setWarData(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        }
    }, []);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch('/api/profile');
                if (res.ok) setUserProfile(await res.json());
            } catch (e) { console.error("Failed to fetch user profile", e); }
        };
        const loadInitialData = async () => {
            setLoading(true);
            await Promise.all([fetchWarData(), fetchProfile()]);
            setLoading(false);
        };
        loadInitialData();
        const interval = setInterval(fetchWarData, 90000);
        return () => clearInterval(interval);
    }, [fetchWarData]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchWarData();
        setIsRefreshing(false);
    };

    const effectiveState = useMemo(() => {
        if (!warData) return 'loading';
        const now = new Date();
        const endTime = parseCocDate(warData.endTime);
        if (warData.state === 'inWar' && !isNaN(endTime.getTime()) && endTime < now) {
            return 'warEnded';
        }
        return warData.state;
    }, [warData]);

    const { 
        clanStars, 
        opponentStars, 
        clanDestruction, 
        opponentDestruction, 
        allAttacks,
        clanAvgDestruction,
        opponentAvgDestruction
    } = useMemo(() => {
        if (!warData || (effectiveState !== 'inWar' && effectiveState !== 'warEnded')) {
            return { clanStars: 0, opponentStars: 0, clanDestruction: 0, opponentDestruction: 0, allAttacks: [], clanAvgDestruction: 0, opponentAvgDestruction: 0 };
        }
        
        let processedAttacks: any[] = [];
        warData.clan.members.forEach((m: any) => {
            if (m.attacks) {
                processedAttacks.push(...m.attacks.map((a: any) => {
                    const defender = warData.opponent.members.find((om: any) => om.tag === a.defenderTag);
                    return { ...a, clan: 'ours', attackerName: m.name, attackerTag: m.tag, attackerMapPosition: m.mapPosition, attackerTownhallLevel: m.townhallLevel, defenderName: defender?.name, defenderMapPosition: defender?.mapPosition, defenderTownhallLevel: defender?.townhallLevel };
                }));
            }
        });
        warData.opponent.members.forEach((m: any) => {
            if (m.attacks) {
                processedAttacks.push(...m.attacks.map((a: any) => {
                    const defender = warData.clan.members.find((cm: any) => cm.tag === a.defenderTag);
                    return { ...a, clan: 'theirs', attackerName: m.name, attackerTag: m.tag, attackerMapPosition: m.mapPosition, attackerTownhallLevel: m.townhallLevel, defenderName: defender?.name, defenderMapPosition: defender?.mapPosition, defenderTownhallLevel: defender?.townhallLevel };
                }));
            }
        });

        const clanAttacks = processedAttacks.filter(a => a.clan === 'ours');
        const opponentAttacks = processedAttacks.filter(a => a.clan === 'theirs');

        const totalClanDestruction = clanAttacks.reduce((sum, a) => sum + a.destructionPercentage, 0);
        const totalOpponentDestruction = opponentAttacks.reduce((sum, a) => sum + a.destructionPercentage, 0);

        const clanAvgDestruction = clanAttacks.length > 0 ? totalClanDestruction / clanAttacks.length : 0;
        const opponentAvgDestruction = opponentAttacks.length > 0 ? totalOpponentDestruction / opponentAttacks.length : 0;

        return { 
            clanStars: warData.clan.stars, 
            opponentStars: warData.opponent.stars, 
            clanDestruction: warData.clan.destructionPercentage, 
            opponentDestruction: warData.opponent.destructionPercentage, 
            allAttacks: processedAttacks.sort((a,b) => b.order - a.order),
            clanAvgDestruction,
            opponentAvgDestruction
        };
    }, [warData, effectiveState]);
    
    if (loading) {
        return (
             <Card className="h-full flex flex-col bg-card/75 backdrop-blur-lg border border-white/10">
                 <CardHeader><CardTitle>Current War Status</CardTitle></CardHeader>
                 <CardContent className="flex-grow flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                 </CardContent>
             </Card>
        );
    }

    if (error) {
        return (
            <Card className="h-full flex flex-col bg-destructive/20 border-destructive">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><AlertTriangle /> War Status Error</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col items-center justify-center text-center">
                    <p>{error}</p>
                    <Button onClick={handleRefresh} disabled={isRefreshing} className="mt-4">
                        <RefreshCw className={cn('mr-2 h-4 w-4', isRefreshing && 'animate-spin')} />
                        Try Again
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (effectiveState === 'notInWar') {
        return (
            <Card className="h-full flex flex-col items-center justify-center bg-card/75 backdrop-blur-lg border border-white/10">
                <CardHeader>
                    <CardTitle>Not Currently in War</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    <Shield className="h-16 w-16 text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Enjoy the peace and quiet!</p>
                </CardContent>
            </Card>
        );
    }
    
    if (effectiveState === 'preparation') {
        return (
            <Card className="h-full flex flex-col bg-card/75 backdrop-blur-lg border border-white/10">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center text-lg md:text-xl">War Prep vs {warData.opponent.name}</CardTitle>
                        <Image src={warData.opponent.badgeUrls.small} alt={warData.opponent.name} width={40} height={40} className="ml-2" />
                    </div>
                     <CardDescription className="flex items-center mt-1">
                        <Users className="h-4 w-4 mr-1" />
                        <span>{warData.teamSize} vs {warData.teamSize}</span>
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col items-center justify-center text-center space-y-4">
                    <div className="text-4xl font-bold"><Clock className="w-12 h-12 mx-auto mb-4 text-primary"/>Starts In</div>
                    <Countdown endTime={warData.startTime} />
                </CardContent>
            </Card>
        );
    }

    if (effectiveState === 'inWar' || effectiveState === 'warEnded') {
        const title = effectiveState === 'inWar' ? `War Against ${warData.opponent.name}` : `War Finished vs ${warData.opponent.name}`;
        return (
            <Card className="bg-card/75 backdrop-blur-lg border border-white/10">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <CardTitle className="text-lg md:text-xl">{title}</CardTitle>
                            <CardDescription>{effectiveState === 'inWar' ? "Battle Day" : "The war has concluded."}</CardDescription>
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
                            <RefreshCw className={cn("h-5 w-5", isRefreshing && "animate-spin")} />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center space-x-2">
                            <Image src={warData.clan.badgeUrls.medium} alt={warData.clan.name} width={40} height={40} />
                            <span className="font-bold text-lg hidden sm:inline">{warData.clan.name}</span>
                        </div>
                        {effectiveState === 'inWar' && <Countdown endTime={warData.endTime} />}
                        <div className="flex items-center space-x-2">
                            <span className="font-bold text-lg hidden sm:inline">{warData.opponent.name}</span>
                            <Image src={warData.opponent.badgeUrls.medium} alt={warData.opponent.name} width={40} height={40} />
                        </div>
                    </div>
                    <div className="flex justify-between items-center text-2xl font-bold mb-2">
                        <div className="flex items-center gap-2"><Star className="h-6 w-6 text-primary" /> {clanStars}</div>
                        <div className="text-muted-foreground text-lg">VS</div>
                        <div className="flex items-center gap-2">{opponentStars} <Star className="h-6 w-6 text-yellow-500" /></div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        <div>
                            <div className="flex justify-between items-center mb-1 text-sm">
                                <span className="font-medium text-muted-foreground">Our Destruction</span>
                                <span className="font-bold text-foreground">{clanDestruction.toFixed(2)}%</span>
                            </div>
                            <Progress value={clanDestruction} />
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-1 text-sm">
                                <span className="font-medium text-muted-foreground">Their Destruction</span>
                                <span className="font-bold text-foreground">{opponentDestruction.toFixed(2)}%</span>
                            </div>
                            <Progress value={opponentDestruction} className="[&>div]:bg-destructive" />
                        </div>
                    </div>

                    <div className="flex justify-between items-center text-center text-sm text-muted-foreground mt-4 pt-4 border-t border-white/10">
                        <div className="flex flex-col w-1/3">
                            <span className="font-bold text-lg text-foreground">{clanAvgDestruction.toFixed(2)}%</span>
                            <span>Avg. Destruction</span>
                        </div>
                        <div className="flex flex-col w-1/3">
                            <Target className="h-6 w-6 mx-auto text-primary" />
                        </div>
                        <div className="flex flex-col w-1/3">
                            <span className="font-bold text-lg text-foreground">{opponentAvgDestruction.toFixed(2)}%</span>
                            <span>Avg. Destruction</span>
                        </div>
                    </div>

                    <Tabs defaultValue="feed" className="mt-6">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="feed">Attack Feed</TabsTrigger>
                            <TabsTrigger value="ourRoster">Our Roster</TabsTrigger>
                            <TabsTrigger value="theirRoster">Their Roster</TabsTrigger>
                        </TabsList>
                        <TabsContent value="feed"><AttackFeed attacks={allAttacks} userPlayerTag={userProfile?.player_tag} /></TabsContent>
                        <TabsContent value="ourRoster"><WarRoster members={warData.clan.members} opponentMembers={warData.opponent.members} userPlayerTag={userProfile?.player_tag} /></TabsContent>
                        <TabsContent value="theirRoster"><WarRoster members={warData.opponent.members} opponentMembers={warData.clan.members} userPlayerTag={userProfile?.player_tag} /></TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        )
    }

    return null;
};

export default CurrentWarStatus; 