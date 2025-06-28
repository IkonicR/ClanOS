'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Target, ShieldCheck, Swords, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Progress } from "@/components/ui/progress";
import { War } from '@/lib/types';

const WarStars = ({ count, size = 'sm' }: { count: number, size?: 'sm' | 'md' }) => {
    const starSize = size === 'sm' ? "h-4 w-4" : "h-5 w-5";
    return (
        <div className="flex justify-center items-center gap-0.5">
            {Array.from({ length: 3 }).map((_, i) => (
                <Star key={i} className={cn(starSize, i < count ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600')} />
            ))}
        </div>
    );
};

const RosterCard = ({ member, isMe }: { member: any, isMe: boolean }) => {
    const attacksUsed = member.attacks?.length ?? 0;
    const bestDefense = member.bestOpponentAttack;
    const attackIcons = [1, 2].map(i => (
        <TooltipProvider key={i}>
            <Tooltip>
                <TooltipTrigger>
                     <Target className={cn("h-5 w-5", attacksUsed >= i ? "text-primary": "text-muted-foreground/30")} />
                </TooltipTrigger>
                <TooltipContent>{i === 1 ? 'First' : 'Second'} attack {attacksUsed >= i ? 'used' : 'available'}</TooltipContent>
            </Tooltip>
        </TooltipProvider>
    ));

    return (
        <Card className={cn("p-3 bg-background/50", isMe && "ring-2 ring-primary shadow-lg")}>
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-muted-foreground">#{member.mapPosition}</span>
                    <div>
                        <p className="font-semibold leading-tight">{member.name}</p>
                        <p className="text-xs text-muted-foreground">Town Hall {member.townhallLevel}</p>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2">
                        <Swords className="h-4 w-4 text-muted-foreground" />
                        <div className="flex items-center gap-1">{attackIcons}</div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        {bestDefense ? (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger className="flex items-center gap-1">
                                        <WarStars count={bestDefense.stars} />
                                        <span className='text-xs font-mono'>({bestDefense.destructionPercentage}%)</span>
                                    </TooltipTrigger>
                                    <TooltipContent>Defended a {bestDefense.stars}-star attack</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        ) : <ShieldCheck className="h-5 w-5 text-green-500" />}
                    </div>
                </div>
            </div>
        </Card>
    );
};

const AttackFeedCard = ({ attack, isMyAttack }: { attack: any, isMyAttack: boolean }) => (
    <Card className={cn(
        "p-3 bg-background/50 border-l-4",
        attack.clan === 'ours' ? 'border-primary' : 'border-destructive',
        isMyAttack && 'ring-2 ring-primary shadow-lg'
    )}>
        <div className="flex items-center justify-between">
            <div className="flex flex-col text-left">
                <p className="font-bold text-sm truncate">{attack.attackerName || 'Unknown'}</p>
                <p className="text-xs text-muted-foreground">#{attack.attackerMapPosition} ➔ #{attack.defenderMapPosition}</p>
            </div>
            <div className="flex flex-col items-end">
                <p className="font-bold text-lg">{attack.destructionPercentage}%</p>
                <WarStars count={attack.stars} />
            </div>
        </div>
    </Card>
);

export default function MobileWarStatus({ warData, userPlayerTag }: { warData: War, userPlayerTag: string }) {
    const allAttacks = React.useMemo(() => {
        if (!warData || warData.state === 'notInWar') return [];
        const clanAttacks = warData.clan.members.flatMap((m: any) => (m.attacks || []).map((a: any) => ({ ...a, clan: 'ours', attackerName: m.name, attackerMapPosition: m.mapPosition, defenderName: warData.opponent.members.find((om: any) => om.tag === a.defenderTag)?.name || '?' })));
        const opponentAttacks = warData.opponent.members.flatMap((m: any) => (m.attacks || []).map((a: any) => ({ ...a, clan: 'theirs', attackerName: m.name, attackerMapPosition: m.mapPosition, defenderName: warData.clan.members.find((cm: any) => cm.tag === a.defenderTag)?.name || '?' })));
        return [...clanAttacks, ...opponentAttacks].sort((a, b) => a.order - b.order);
    }, [warData]);
    
    if (warData.state === 'notInWar') {
        return (
            <Card className="bg-background/80 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>Not in War</CardTitle>
                    <CardDescription>The clan is not currently in a war.</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    const { clan, opponent } = warData;
    const sortedMembers = [...clan.members].sort((a,b) => a.mapPosition - b.mapPosition);

    const WarHeader = () => (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <p className="font-bold text-lg">{clan.name}</p>
                <div className="flex items-center gap-2">
                    <p className="font-bold text-xl text-primary">{clan.stars}</p>
                    <Star className="h-5 w-5 text-primary fill-primary" />
                </div>
            </div>
            <Progress value={clan.destructionPercentage} className="h-2 [&>*]:bg-primary" />
            
            <div className="flex items-center justify-between">
                <p className="font-bold text-lg">{opponent.name}</p>
                <div className="flex items-center gap-2">
                    <p className="font-bold text-xl text-destructive">{opponent.stars}</p>
                    <Star className="h-5 w-5 text-destructive fill-destructive" />
                </div>
            </div>
            <Progress value={opponent.destructionPercentage} className="h-2 [&>*]:bg-destructive" />
        </div>
    );

    return (
        <Card className="bg-background/80 backdrop-blur-sm">
            <CardHeader>
                <div className="flex justify-between items-center mb-4">
                    <CardTitle>Current War</CardTitle>
                </div>
                <WarHeader />
            </CardHeader>
            <CardContent>
                 <Tabs defaultValue="roster">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="roster">Roster</TabsTrigger>
                        <TabsTrigger value="feed">Attack Feed</TabsTrigger>
                    </TabsList>
                    <TabsContent value="roster" className="mt-4">
                         <div className="space-y-2 max-h-[450px] overflow-y-auto">
                            {sortedMembers.map((member) => (
                                <RosterCard 
                                    key={member.tag} 
                                    member={member} 
                                    isMe={!!(userPlayerTag && member.tag === userPlayerTag)}
                                />
                            ))}
                        </div>
                    </TabsContent>
                    <TabsContent value="feed" className="mt-4">
                        <div className="space-y-2 max-h-[450px] overflow-y-auto">
                             {allAttacks.length > 0 ? allAttacks.map((attack) => (
                                <AttackFeedCard 
                                    key={attack.order} 
                                    attack={attack} 
                                    isMyAttack={!!(userPlayerTag && attack.attackerTag === userPlayerTag)}
                                />
                            )) : <div className="text-center py-10 text-muted-foreground">No attacks yet.</div>}
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
} 