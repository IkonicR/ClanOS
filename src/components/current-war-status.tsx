'use client';

import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Swords, Star, ShieldCheck, Target, Clock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { War, Clan, WarMember } from '@/lib/types';

function parseCocDate(dateString: string): Date {
    if (!dateString || dateString.length < 15) return new Date(NaN);
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);
    const hour = dateString.substring(9, 11);
    const minute = dateString.substring(11, 13);
    const second = dateString.substring(13, 15);
    const isoString = `${year}-${month}-${day}T${hour}:${minute}:${second}.000Z`;
    return new Date(isoString);
}

const Countdown = ({ endTime, onEnd, title }: { endTime: string, onEnd?: () => void, title: string }) => {
    const [timeLeft, setTimeLeft] = React.useState('');

    React.useEffect(() => {
        const calculateTimeLeft = () => {
            const endDateTime = parseCocDate(endTime);
            if (isNaN(endDateTime.getTime())) {
                setTimeLeft("Invalid Date");
                return;
            }
            const difference = +endDateTime - +new Date();
            if (difference > 0) {
                const hours = Math.floor(difference / (1000 * 60 * 60));
                const minutes = Math.floor((difference / 1000 / 60) % 60);
                const seconds = Math.floor((difference / 1000) % 60);
                setTimeLeft(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
            } else {
                setTimeLeft("Finished");
                if(onEnd) onEnd();
            }
        };
        const timer = setInterval(calculateTimeLeft, 1000);
        calculateTimeLeft();
        return () => clearInterval(timer);
    }, [endTime, onEnd]);

    return (
        <div className="text-center">
            <p className="text-sm uppercase text-muted-foreground font-semibold tracking-wider">{title}</p>
            <p className="text-4xl font-bold font-mono tracking-tight">{timeLeft}</p>
        </div>
    );
};

const WarStars = ({ count }: { count: number }) => (
    <div className="flex justify-center items-center">
        {Array.from({ length: 3 }).map((_, i) => (
            <Star key={i} className={cn("h-4 w-4", i < count ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30')} />
        ))}
    </div>
);

const AttackFeed = ({ attacks, userPlayerTag }: { attacks: any[], userPlayerTag?: string }) => {
    if (attacks.length === 0) {
        return <div className="text-center text-muted-foreground py-10">No attacks recorded yet.</div>
    }
    return (
        <div className="space-y-4">
            {attacks.map((attack) => {
                const isMyAttack = userPlayerTag && attack.attackerTag === userPlayerTag;
                const wasMeAttacked = userPlayerTag && attack.defenderTag === userPlayerTag;
                return (
                     <div key={attack.order} className={cn(
                        "flex items-center justify-between p-3 rounded-lg bg-secondary/50 border-l-4 transition-all",
                        attack.clan === 'ours' ? 'border-primary' : 'border-destructive',
                        isMyAttack && 'ring-2 ring-primary bg-primary/10',
                        wasMeAttacked && 'ring-2 ring-destructive bg-destructive/20'
                    )}>
                        <div className="flex flex-col items-center w-1/4 text-center">
                            <span className={cn("font-bold text-sm truncate", isMyAttack && "text-primary")}>{attack.attackerName || 'Unknown'}</span>
                            <span className="text-xs text-muted-foreground">#{attack.attackerMapPosition}</span>
                        </div>
                        <div className="flex flex-col items-center flex-grow px-2">
                            <span className="font-bold text-lg">{attack.destructionPercentage}%</span>
                            <WarStars count={attack.stars} />
                        </div>
                        <div className="flex flex-col items-center w-1/4 text-center">
                            <span className={cn("font-bold text-sm truncate", wasMeAttacked && "text-destructive")}>{attack.defenderName || 'Unknown'}</span>
                            <span className="text-xs text-muted-foreground">#{attack.defenderMapPosition}</span>
                        </div>
                    </div>
                )
            })}
        </div>
    );
};

const RosterRow = ({ member, isMe, opponentMembers }: { member: WarMember, isMe: boolean, opponentMembers: WarMember[] }) => {
    const bestDefense = member.bestOpponentAttack;
    const attacker = bestDefense ? opponentMembers.find(m => m.tag === bestDefense.attackerTag) : null;

    return (
        <TableRow className={cn(isMe && "bg-primary/10 hover:bg-primary/20")}>
            <TableCell className="text-center font-bold">{member.mapPosition}</TableCell>
            <TableCell>
                <div className={cn("font-medium", isMe && "font-extrabold text-primary")}>{member.name}</div>
                <div className="text-xs text-muted-foreground">TH{member.townhallLevel}</div>
            </TableCell>
            <TableCell className="text-left">
                {member.attacks && member.attacks.length > 0 ? (
                    <div className="flex flex-col gap-1.5">
                        {member.attacks.map((attack, index) => {
                            const defender = opponentMembers.find(m => m.tag === attack.defenderTag);
                            return (
                                <TooltipProvider key={index}>
                                    <Tooltip>
                                        <TooltipTrigger className="flex items-center gap-2 text-sm">
                                            <WarStars count={attack.stars} />
                                            <span>{attack.destructionPercentage}% vs #{defender?.mapPosition ?? '?'}</span>
                                        </TooltipTrigger>
                                        <TooltipContent>Attack on {defender?.name || 'Unknown'}</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-xs text-muted-foreground">No attacks yet</div>
                )}
            </TableCell>
            <TableCell className="text-center">
                <div className="flex items-center justify-center">
                    {bestDefense ? (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger className="flex items-center gap-1">
                                    <WarStars count={bestDefense.stars} />
                                    <span className='text-xs font-mono'>({bestDefense.destructionPercentage}%)</span>
                                </TooltipTrigger>
                                <TooltipContent>Defended against {attacker?.name || 'Unknown'}</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    ) : <ShieldCheck className="h-5 w-5 text-green-500" />}
                </div>
            </TableCell>
        </TableRow>
    );
};

export const CurrentWarStatus = ({ currentWar, userPlayerTag }: { clan: Clan, currentWar: War, userPlayerTag?: string }) => {
    const [warState, setWarState] = React.useState(currentWar.state);
    
    React.useEffect(() => {
        setWarState(currentWar.state);
    }, [currentWar.state]);

    if (warState === 'notInWar') {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Not in War</CardTitle>
                    <CardDescription>Your clan is not currently in a war.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center p-10">
                    <ShieldCheck className="h-24 w-24 text-muted-foreground/20" />
                </CardContent>
            </Card>
        );
    }
    
    const { clan, opponent } = currentWar;

    if (warState === 'preparation') {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>War Preparation</CardTitle>
                    <CardDescription>Get ready for war against <strong>{opponent.name}</strong>!</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center p-10">
                   <Countdown endTime={currentWar.startTime} title="War Starts In" onEnd={() => setWarState('inWar')} />
                </CardContent>
            </Card>
        );
    }
    
    const sortedMembers = [...clan.members].sort((a, b) => a.mapPosition - b.mapPosition);

    const allAttacks = React.useMemo(() => {
        if (!currentWar || currentWar.state === 'notInWar') return [];
        let processedAttacks: any[] = [];
        currentWar.clan.members.forEach((m: any) => {
            if (m.attacks) {
                processedAttacks.push(...m.attacks.map((a: any) => {
                    const defender = currentWar.opponent.members.find((om: any) => om.tag === a.defenderTag);
                    return { ...a, clan: 'ours', attackerName: m.name, attackerTag: m.tag, attackerMapPosition: m.mapPosition, defenderName: defender?.name, defenderMapPosition: defender?.mapPosition };
                }));
            }
        });
        currentWar.opponent.members.forEach((m: any) => {
            if (m.attacks) {
                processedAttacks.push(...m.attacks.map((a: any) => {
                    const defender = currentWar.clan.members.find((cm: any) => cm.tag === a.defenderTag);
                    return { ...a, clan: 'theirs', attackerName: m.name, attackerTag: m.tag, attackerMapPosition: m.mapPosition, defenderName: defender?.name, defenderMapPosition: defender?.mapPosition };
                }));
            }
        });
        return processedAttacks.sort((a,b) => b.order - a.order);
    }, [currentWar]);

    return (
        <Card className="bg-card/75 backdrop-blur-lg border-white/10">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Swords /> War against {currentWar.opponent.name}
                        </CardTitle>
                        <CardDescription>
                            {currentWar.teamSize} vs {currentWar.teamSize}
                        </CardDescription>
                    </div>
                    <div className="text-right">
                         <div className="flex items-center gap-2">
                            <Image src={clan.badgeUrls.medium} alt="Clan Badge" width={40} height={40} />
                            <span className="text-2xl font-bold">{currentWar.clan.stars}</span>
                            <span className="text-muted-foreground">vs</span>
                            <span className="text-2xl font-bold">{currentWar.opponent.stars}</span>
                            <Image src={currentWar.opponent.badgeUrls.medium} alt="Opponent Badge" width={40} height={40} />
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {currentWar.clan.destructionPercentage.toFixed(2)}% vs {currentWar.opponent.destructionPercentage.toFixed(2)}%
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="feed">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="feed">Attack Feed</TabsTrigger>
                        <TabsTrigger value="roster">Roster</TabsTrigger>
                    </TabsList>
                     <TabsContent value="feed" className="mt-4 max-h-[400px] overflow-y-auto pr-2">
                        <AttackFeed attacks={allAttacks} userPlayerTag={userPlayerTag} />
                    </TabsContent>
                    <TabsContent value="roster" className="mt-4 max-h-[400px] overflow-y-auto pr-2">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-center w-[60px]">#</TableHead>
                                    <TableHead>Player</TableHead>
                                    <TableHead>Attacks</TableHead>
                                    <TableHead className="text-center">Defense</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedMembers.map((member) => (
                                    <RosterRow key={member.tag} member={member} isMe={!!(userPlayerTag && member.tag === userPlayerTag)} opponentMembers={opponent.members} />
                                ))}
                            </TableBody>
                        </Table>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}; 