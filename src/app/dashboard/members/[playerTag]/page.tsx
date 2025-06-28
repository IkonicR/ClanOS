'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Loader } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/lib/types';
import { useUser } from '@/lib/hooks/useUser';

import ProfileHeader from '@/components/profile/ProfileHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import ClashStatsTab from '@/components/profile/ClashStatsTab';
// import ActivityFeedTab from '@/components/profile/ActivityFeedTab';
// import WarLayoutsTab from '@/components/profile/WarLayoutsTab';

type PlayerData = any; // Replace with a proper type later
type CombinedProfile = {
    profile: Profile | null;
    playerData: PlayerData | null;
};

const PlayerProfilePage = () => {
    const params = useParams();
    const { user } = useUser();
    const playerTag = params.playerTag as string;
    const [data, setData] = useState<CombinedProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        // Ensure playerTag is a valid string before fetching
        if (!playerTag || typeof playerTag !== 'string') {
            setLoading(false);
            // Optionally set an error message
            setError('Invalid player tag in URL.');
            return;
        }

        const fetchProfileData = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch player data from CoC API via our server
                const playerRes = await fetch(`/api/players/${playerTag}`);
                if (!playerRes.ok) {
                    const errorData = await playerRes.json();
                    throw new Error(errorData.error || 'Failed to fetch player data');
                }
                const playerData = await playerRes.json();

                // Fetch user profile from our database
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('player_tag', `#${playerTag.replace('%23', '')}`)
                    .single();
                
                if (profileError && profileError.code !== 'PGRST116') { // Ignore 'not found' errors
                    throw profileError;
                }

                setData({ playerData, profile: profileData });
            } catch (err) {
                console.error(err);
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, [playerTag, supabase]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-200px)]">
                <Loader className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return <div className="text-destructive text-center py-10">Error: {error}</div>;
    }

    if (!data?.playerData) {
        return <div className="text-muted-foreground text-center py-10">No player data found for this tag.</div>;
    }

    const isOwner = user?.id === data?.profile?.id;

    const handleProfileUpdate = (updatedProfile: Profile) => {
        setData(prevData => ({
            ...prevData!,
            profile: updatedProfile,
        }));
    };

    return (
        <div className="space-y-6">
            <ProfileHeader 
                profile={data.profile} 
                playerData={data.playerData} 
                isOwner={isOwner}
                onProfileUpdate={handleProfileUpdate}
            />
            
            <div className="container mx-auto">
                <Tabs defaultValue="clash-stats" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="clash-stats">Clash Stats</TabsTrigger>
                        <TabsTrigger value="activity">Activity</TabsTrigger>
                        <TabsTrigger value="layouts">War Layouts</TabsTrigger>
                    </TabsList>
                    <TabsContent value="clash-stats">
                        {/* <ClashStatsTab playerData={data.playerData} /> */}
                        <p className="p-4 text-center">Clash Stats Coming Soon!</p>
                    </TabsContent>
                    <TabsContent value="activity">
                        {/* <ActivityFeedTab profile={data.profile} /> */}
                        <p className="p-4 text-center">Activity Feed Coming Soon!</p>
                    </TabsContent>
                    <TabsContent value="layouts">
                        {/* <WarLayoutsTab profile={data.profile} /> */}
                        <p className="p-4 text-center">War Layouts Coming Soon!</p>
                    </TabsContent>
                </Tabs> 
            </div>
        </div>
    );
};

export default PlayerProfilePage; 