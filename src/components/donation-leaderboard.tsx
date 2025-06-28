'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { MoreHorizontal, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type Member = {
    tag: string;
    name: string;
    role: 'leader' | 'coLeader' | 'admin' | 'member';
    townHallLevel: number;
    expLevel: number;
    league: {
        id: number;
        name: string;
        iconUrls: {
            small: string;
            tiny: string;
            medium?: string;
        };
    };
    trophies: number;
    versusTrophies: number;
    clanRank: number;
    previousClanRank: number;
    donations: number;
    donationsReceived: number;
    playerHouse?: {
        elements: {
            type: string;
            id: number;
        }[];
    };
    builderBaseLeague?: {
        id: number;
        name: string;
    };
};

type LeaderboardProps = {
    members: Member[];
    playerTag: string;
};

type SortKey = 'donations' | 'donationsReceived' | 'ratio';

interface MemberTableProps {
    members: Member[];
    type: SortKey;
    playerTag: string;
    isLeader: boolean;
}

const MemberRow = ({ member, index, type, isLeader, isCurrentUser, getMemberValue, getProgressValue }: any) => {
    const donationRatio = member.donationsReceived > 0 ? member.donations / member.donationsReceived : member.donations;
    const showWarning = isLeader && donationRatio < 0.3 && type === 'ratio';

    return (
        <TableRow className={cn(isCurrentUser && "bg-accent/20")}>
            <TableCell className="font-medium">{index + 1}</TableCell>
            <TableCell>
                <div className="flex items-center space-x-2">
                    <Image src={member.league.iconUrls.tiny} alt={member.league.name} width={24} height={24} />
                    <div>
                        <p className="font-medium truncate max-w-[120px]">{member.name}</p>
                        <p className="text-xs text-muted-foreground">TH{member.townHallLevel}</p>
                    </div>
                </div>
            </TableCell>
            <TableCell className="text-right">
                <div className="flex flex-col items-end">
                    <span className="font-semibold">{getMemberValue(member)}</span>
                    <Progress value={getProgressValue(member)} className="h-1 w-20 mt-1" />
                </div>
            </TableCell>
            {isLeader && (
                <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                        {showWarning && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </div>
                </TableCell>
            )}
        </TableRow>
    )
}

const MemberCard = ({ member, index, type, isLeader, isCurrentUser, getMemberValue, getProgressValue }: any) => {
    const donationRatio = member.donationsReceived > 0 ? member.donations / member.donationsReceived : member.donations;
    const showWarning = isLeader && donationRatio < 0.3 && type === 'ratio';

    return (
        <div className={cn("p-3 rounded-lg bg-secondary/30", isCurrentUser && "ring-1 ring-primary")}>
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-muted-foreground">#{index + 1}</span>
                    <Image src={member.league.iconUrls.tiny} alt={member.league.name} width={28} height={28} />
                    <div>
                        <p className="font-semibold truncate max-w-[150px]">{member.name}</p>
                        <p className="text-xs text-muted-foreground">TH{member.townHallLevel}</p>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                     <span className="font-bold">{getMemberValue(member)}</span>
                     <span className="text-xs text-muted-foreground">{type === 'ratio' ? 'Ratio' : type === 'donations' ? 'Donated' : 'Received'}</span>
                </div>
            </div>
            <Progress value={getProgressValue(member)} className="h-1.5 w-full mt-2" />
        </div>
    )
}

const MemberTable: React.FC<MemberTableProps> = ({ members, type, playerTag, isLeader }) => {
    const topValue = useMemo(() => {
        if (members.length === 0) return 1;
        if (type === 'ratio') {
            const member = members[0];
            return member.donationsReceived > 0 ? member.donations / member.donationsReceived : member.donations;
        }
        return members[0][type];
    }, [members, type]);

    const getMemberValue = (member: Member) => {
        if (type === 'ratio') {
            const ratio = member.donationsReceived > 0 ? member.donations / member.donationsReceived : member.donations;
            return ratio.toFixed(2);
        }
        return member[type];
    };

    const getProgressValue = (member: Member) => {
        if (topValue === 0) return 0;
        if (type === 'ratio') {
            const ratio = member.donationsReceived > 0 ? member.donations / member.donationsReceived : member.donations;
            return (ratio / topValue) * 100;
        }
        return (member[type] / topValue) * 100;
    };

    return (
        <div className="overflow-y-auto max-h-96">
            {/* Mobile Card View */}
            <div className="md:hidden space-y-2 mt-4">
                {members.map((member, index) => (
                    <MemberCard 
                        key={member.tag}
                        member={member} 
                        index={index}
                        type={type}
                        isLeader={isLeader}
                        isCurrentUser={member.tag === playerTag}
                        getMemberValue={getMemberValue}
                        getProgressValue={getProgressValue}
                    />
                ))}
            </div>
            {/* Desktop Table View */}
            <div className="hidden md:block">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">Rank</TableHead>
                            <TableHead>Player</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            {isLeader && <TableHead className="w-[50px] text-right"> </TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {members.map((member, index) => (
                           <MemberRow
                                key={member.tag}
                                member={member} 
                                index={index}
                                type={type}
                                isLeader={isLeader}
                                isCurrentUser={member.tag === playerTag}
                                getMemberValue={getMemberValue}
                                getProgressValue={getProgressValue}
                           />
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};


const DonationLeaderboard = ({ members, playerTag }: LeaderboardProps) => {
    const loggedInUser = useMemo(() => members.find(m => m.tag === playerTag), [members, playerTag]);
    const isLeader = loggedInUser?.role === 'leader' || loggedInUser?.role === 'coLeader';

    const sortedByDonations = useMemo(() => {
        return [...members].sort((a, b) => b.donations - a.donations);
    }, [members]);

    const sortedByDonationsReceived = useMemo(() => {
        return [...members].sort((a, b) => b.donationsReceived - a.donationsReceived);
    }, [members]);
    
    const sortedByRatio = useMemo(() => {
        return [...members].sort((a, b) => {
            const ratioA = a.donationsReceived > 0 ? a.donations / a.donationsReceived : a.donations;
            const ratioB = b.donationsReceived > 0 ? b.donations / b.donationsReceived : b.donations;
            return ratioB - ratioA;
        });
    }, [members]);

    return (
        <Card className="bg-card/75 backdrop-blur-lg border border-white/10 transition-all duration-300 hover:border-white/25 hover:shadow-2xl">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Donation Leaderboard</CardTitle>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Donations reset at the end of each season.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="donations" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="donations">Top Donors</TabsTrigger>
                        <TabsTrigger value="donationsReceived">Top Receivers</TabsTrigger>
                        <TabsTrigger value="ratio">Ratio</TabsTrigger>
                    </TabsList>
                    <TabsContent value="donations">
                        <MemberTable members={sortedByDonations} type="donations" playerTag={playerTag} isLeader={isLeader} />
                    </TabsContent>
                    <TabsContent value="donationsReceived">
                         <MemberTable members={sortedByDonationsReceived} type="donationsReceived" playerTag={playerTag} isLeader={isLeader} />
                    </TabsContent>
                    <TabsContent value="ratio">
                         <MemberTable members={sortedByRatio} type="ratio" playerTag={playerTag} isLeader={isLeader} />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
};

export default DonationLeaderboard; 