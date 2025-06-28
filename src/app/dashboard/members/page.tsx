'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader, User, Shield, Trophy, ArrowUp, ArrowDown, Search, UserPlus, Check, Clock } from 'lucide-react';
import { MemberWithFriendship } from '@/lib/types';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { cn, getTownHallImage } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
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
                        <div className='flex justify-between items-start'>
                             <div>
                                <Link href={`/dashboard/members/${encodeURIComponent(member.tag)}`}>
                                    <h3 className="text-lg font-bold text-white/90 hover:text-primary transition-colors">{member.name}</h3>
                                </Link>
                                <p className="text-sm text-muted-foreground">{member.tag}</p>
                            </div>
                            <Badge variant={getRoleBadgeVariant(member.role)} className="ml-2 whitespace-nowrap">{formatRole(member.role)}</Badge>
                        </div>
                       
                        <div className="flex items-center space-x-4 mt-3">
                            <div className="flex items-center text-sm">
                                <Image src={member.league.iconUrls.tiny} alt={member.league.name} width={24} height={24} className="mr-1" />
                                {member.trophies}
                            </div>
                            <div className="flex items-center text-sm" title="Donations">
                                <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                                {member.donations}
                            </div>
                             <div className="flex items-center text-sm" title="Donations Received">
                                <ArrowDown className="h-4 w-4 text-red-500 mr-1" />
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

    return (
        <>
            <Toaster />
            <div className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0 mb-6">
                <h2 className="text-3xl font-bold tracking-tight text-white/90">Clan Members ({members.length})</h2>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search member..."
                            value={searchTerm}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-background/50 border-white/20"
                        />
                    </div>
                    <Select onValueChange={(value: SortableKey) => setSortKey(value)} defaultValue="clanRank">
                        <SelectTrigger className="w-[180px] bg-background/50 border-white/20">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="clanRank">Clan Rank</SelectItem>
                            <SelectItem value="trophies">Trophies</SelectItem>
                            <SelectItem value="donations">Donations</SelectItem>
                            <SelectItem value="donationsReceived">Received</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                 {sortedAndFilteredMembers.map((member) => (
                    <MemberCard key={member.tag} member={member} onUpdate={handleFriendshipUpdate}/>
                ))}
            </div>
        </>
    );
};

export default MembersPage; 