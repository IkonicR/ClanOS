'use client';

import React, { useState, useEffect } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Bell, UserCheck, UserX } from 'lucide-react';
import { useToast } from './ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import Link from 'next/link';

interface Requester {
    id: string;
    username: string;
    avatar_url: string | null;
}

interface FriendRequest {
    id: string;
    requester: Requester;
}

export const FriendRequestsDropdown = () => {
    const [requests, setRequests] = useState<FriendRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchRequests = async () => {
            setIsLoading(true);
            try {
                const res = await fetch('/api/friends/requests');
                if (!res.ok) throw new Error("Failed to fetch requests");
                const data = await res.json();
                setRequests(data);
            } catch (error) {
                console.error("Error fetching friend requests:", error);
                toast({ variant: 'destructive', title: 'Error', description: 'Could not load friend requests.' });
            } finally {
                setIsLoading(false);
            }
        };

        fetchRequests();
    }, [toast]);

    const handleResponse = async (friendship_id: string, status: 'accepted' | 'blocked') => {
        // Optimistically update the UI
        setRequests(prev => prev.filter(req => req.id !== friendship_id));

        try {
            const res = await fetch('/api/friends', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ friendship_id, status })
            });

            const data = await res.json();

            if (!res.ok) {
                // Revert optimistic update on failure
                // Note: For a more robust implementation, you might want to refetch or show a specific error for the failed item.
                throw new Error(data.error || `Failed to ${status === 'accepted' ? 'accept' : 'decline'} request.`);
            }

            toast({
                title: 'Success',
                description: `Friend request ${status === 'accepted' ? 'accepted' : 'declined'}.`
            });

        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error instanceof Error ? error.message : 'An unknown error occurred.',
            });
            // Consider refetching to get the true state from the server
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {requests.length > 0 && (
                        <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 justify-center rounded-full p-0 text-xs">
                            {requests.length}
                        </Badge>
                    )}
                    <span className="sr-only">Friend Requests</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <div className="p-2 font-semibold">Friend Requests</div>
                <DropdownMenuSeparator />
                {isLoading ? (
                     <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
                ) : requests.length === 0 ? (
                    <DropdownMenuItem disabled>No pending requests.</DropdownMenuItem>
                ) : (
                    requests.map(req => (
                        <DropdownMenuItem key={req.id} className="flex items-center justify-between p-2">
                             <Link href={`/dashboard/members/${encodeURIComponent(req.requester.id)}`} className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={req.requester.avatar_url || ''} />
                                    <AvatarFallback>{req.requester.username.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <span>{req.requester.username}</span>
                            </Link>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="p-1 h-7" onClick={() => handleResponse(req.id, 'accepted')}>
                                    <UserCheck className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="destructive" className="p-1 h-7" onClick={() => handleResponse(req.id, 'blocked')}>
                                     <UserX className="h-4 w-4" />
                                </Button>
                            </div>
                        </DropdownMenuItem>
                    ))
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}; 