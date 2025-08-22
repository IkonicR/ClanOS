'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader, User, Shield, Trophy, ArrowUp, ArrowDown, Search, UserPlus, Check, Clock, Users, Crown, TrendingUp, Filter } from 'lucide-react';
import { MemberWithFriendship } from '@/lib/types';
import Link from 'next/link';
import { cn, getTownHallImage } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

type SortableKey = 'clanRank' | 'trophies' | 'donations' | 'donationsReceived';

const formatRole = (role: string) => {
    if (role === 'coLeader') return 'Co-Leader';
    if (role === 'admin') return 'Elder';
    return role.charAt(0).toUpperCase() + role.slice(1);
}

const getRoleBadgeVariant = (role: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (role) {
        case 'leader': return 'default';
        case 'coLeader': return 'secondary';
        case 'elder': return 'outline';
        default: return 'outline';
    }
}

const FriendshipButton = ({ member, onUpdate }: { member: MemberWithFriendship, onUpdate: (tag: string, newStatus: MemberWithFriendship['friendship']) => void }) => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const handleSendRequest = async () => {
        if (!member.profile_id) return;
        setIsLoading(true);
        try {
            const res = await fetch('/api/friends', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ addressee_id: member.profile_id })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to send request');
            toast({ title: "Success", description: "Friend request sent!" });
            onUpdate(member.tag, { id: data.id, status: 'pending', isRequester: true });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: error instanceof Error ? error.message : "An unknown error occurred." });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAcceptRequest = async () => {
        if (!member.friendship?.id) return;
        setIsLoading(true);
        try {
            const res = await fetch('/api/friends', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ friendship_id: member.friendship.id, status: 'accepted' })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to accept request');
            toast({ title: "Success", description: "Friend request accepted!" });
            onUpdate(member.tag, { ...member.friendship, status: 'accepted' });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: error instanceof Error ? error.message : "An unknown error occurred." });
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveFriend = async () => {
        if (!member.friendship?.id) return;
        setIsLoading(true);
        try {
            const res = await fetch('/api/friends', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ friendship_id: member.friendship.id })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to remove friend');
            toast({ title: "Success", description: "Friend removed." });
            onUpdate(member.tag, null);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: error instanceof Error ? error.message : "An unknown error occurred." });
        } finally {
            setIsLoading(false);
        }
    }

    if (!member.profile_id) {
        return <Button variant="outline" size="sm" className="w-full mt-4" disabled>Not on App</Button>
    }

    const { friendship } = member;

    if (friendship) {
        switch (friendship.status) {
            case 'pending':
                if (friendship.isRequester) {
                    return <Button variant="outline" size="sm" className="w-full mt-4" disabled><Clock className="mr-2 h-4 w-4"/>Request Sent</Button>;
                } else {
                    return <Button size="sm" className="w-full mt-4" onClick={handleAcceptRequest} disabled={isLoading}><UserPlus className="mr-2 h-4 w-4"/>Accept Request</Button>;
                }
            case 'accepted':
                return <Button variant="secondary" size="sm" className="w-full mt-4" onClick={handleRemoveFriend} disabled={isLoading}><Check className="mr-2 h-4 w-4"/>Friends</Button>;
            case 'blocked':
                 return <Button variant="destructive" size="sm" className="w-full mt-4" disabled>Blocked</Button>;
        }
    }
    
    return <Button variant="outline" size="sm" className="w-full mt-4" onClick={handleSendRequest} disabled={isLoading}><UserPlus className="mr-2 h-4 w-4"/>Add Friend</Button>;
}


const MemberCard = ({ member, onUpdate }: { member: MemberWithFriendship, onUpdate: (tag: string, newStatus: MemberWithFriendship['friendship']) => void }) => {
    return (
        <Card className="bg-card/60 backdrop-blur-lg border border-white/10 overflow-hidden transition-all hover:border-primary/50 hover:shadow-lg flex flex-col">
            <CardContent className="p-4 flex flex-col flex-grow">
                <div className="flex items-start space-x-4">
                     <Image 
                        src={getTownHallImage(member.townHallLevel)} 
                        alt={`Town Hall ${member.townHallLevel}`}
                        width={64} 
                        height={64}
                        className="w-16 h-16"
                    />
                    <div className="flex-grow">
                        <div className='flex justify-between items-start mb-2'>
                             <Link href={`/dashboard/members/${encodeURIComponent(member.tag)}`} className="group flex-grow">
                                <h3 className="text-lg font-bold text-white/90 group-hover:text-primary transition-colors">{member.name}</h3>
                                <p className="text-sm text-muted-foreground group-hover:text-primary/80 transition-colors">{member.tag}</p>
                            </Link>
                            <Badge variant={getRoleBadgeVariant(member.role)} className="ml-2 whitespace-nowrap self-start">{formatRole(member.role)}</Badge>
                        </div>
                       
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center text-sm">
                                <Image src={member.league.iconUrls.tiny} alt={member.league.name} width={24} height={24} className="mr-1" />
                                {member.trophies}
                            </div>
                            <div className="flex items-center text-sm" title="Donations">
                                <ArrowUp className="h-4 w-4 text-success mr-1" />
                                {member.donations}
                            </div>
                             <div className="flex items-center text-sm" title="Donations Received">
                                <ArrowDown className="h-4 w-4 text-destructive mr-1" />
                                {member.donationsReceived}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-auto pt-4">
                    <FriendshipButton member={member} onUpdate={onUpdate} />
                </div>
            </CardContent>
        </Card>
    );
};

const MembersPage = () => {
    const [members, setMembers] = useState<MemberWithFriendship[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortKey, setSortKey] = useState<SortableKey>('clanRank');

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/clan-members');
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to fetch members');
            }
            const data = await res.json();
            setMembers(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, []);

    const handleFriendshipUpdate = (playerTag: string, newStatus: MemberWithFriendship['friendship']) => {
        setMembers(currentMembers =>
            currentMembers.map(m =>
                m.tag === playerTag ? { ...m, friendship: newStatus } : m
            )
        );
    };

    const sortedAndFilteredMembers = useMemo(() => {
        let sortableItems = [...members];
        if (searchTerm) {
            sortableItems = sortableItems.filter(member =>
                member.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        sortableItems.sort((a, b) => {
            if (a[sortKey] < b[sortKey]) {
                return -1;
            }
            if (a[sortKey] > b[sortKey]) {
                return 1;
            }
            return 0;
        });
        
        if (sortKey === 'trophies' || sortKey === 'donations' || sortKey === 'donationsReceived') {
            return sortableItems.reverse();
        }

        return sortableItems;
    }, [members, searchTerm, sortKey]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (error) {
        return <div className="text-destructive text-center">Error: {error}</div>;
    }

    // Calculate statistics
    const totalDonations = members.reduce((acc, member) => acc + member.donations, 0);
    const totalDonationsReceived = members.reduce((acc, member) => acc + member.donationsReceived, 0);
    const avgTrophies = Math.round(members.reduce((acc, member) => acc + member.trophies, 0) / members.length);
    const avgTownHall = Math.round(members.reduce((acc, member) => acc + member.townHallLevel, 0) / members.length);

    const roleDistribution = members.reduce((acc: any, member) => {
        acc[member.role] = (acc[member.role] || 0) + 1;
        return acc;
    }, {});

    const lowActivityMembers = members.filter(m => m.donations < 50).length;
    const highTrophyMembers = members.filter(m => m.trophies > 3000).length;

    return (
        <div className="space-y-6">
            <Toaster />

            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Members</h1>
                    <p className="text-muted-foreground">Manage your clan members and relationships</p>
                </div>
                <Button className="gap-2">
                    <UserPlus className="w-4 h-4" />
                    Invite Member
                </Button>
            </div>

            {/* Statistics Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{members.length}</div>
                        <p className="text-xs text-muted-foreground">Active members</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Trophies</CardTitle>
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{avgTrophies.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Per member</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
                        <ArrowUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalDonations.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">This season</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Low Activity</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{lowActivityMembers}</div>
                        <p className="text-xs text-muted-foreground">Donations &lt; 50</p>
                        <Progress value={(members.length - lowActivityMembers) / members.length * 100} className="mt-2" />
                    </CardContent>
                </Card>
            </div>

            {/* Search and Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                    <Input
                                        placeholder="Search members by name..."
                                        value={searchTerm}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <Select onValueChange={(value: SortableKey) => setSortKey(value)} defaultValue="clanRank">
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Sort by" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="clanRank">Clan Rank</SelectItem>
                                    <SelectItem value="trophies">Trophies</SelectItem>
                                    <SelectItem value="donations">Donations</SelectItem>
                                    <SelectItem value="donationsReceived">Received</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button variant="outline" size="sm">
                                <Filter className="w-4 h-4 mr-2" />
                                Filters
                            </Button>
                        </div>

                        {/* Quick Role Filter */}
                        <div className="flex gap-2 flex-wrap">
                            <Button variant="outline" size="sm" className="h-8">
                                All ({members.length})
                            </Button>
                            <Button variant="outline" size="sm" className="h-8">
                                Leaders ({roleDistribution.leader || 0})
                            </Button>
                            <Button variant="outline" size="sm" className="h-8">
                                Co-Leaders ({roleDistribution.coLeader || 0})
                            </Button>
                            <Button variant="outline" size="sm" className="h-8">
                                Elders ({roleDistribution.elder || 0})
                            </Button>
                            <Button variant="outline" size="sm" className="h-8">
                                Members ({roleDistribution.member || 0})
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Members Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {sortedAndFilteredMembers.map((member) => (
                    <MemberCard key={member.tag} member={member} onUpdate={handleFriendshipUpdate}/>
                ))}
            </div>

            {sortedAndFilteredMembers.length === 0 && (
                <Card>
                    <CardContent className="py-8 text-center">
                        <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No members found</h3>
                        <p className="text-muted-foreground">
                            {searchTerm ? 'Try adjusting your search criteria' : 'No members match the current filters'}
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default MembersPage; 