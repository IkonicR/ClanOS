'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Loader, User, Shield, Trophy, Star, TrendingUp, TrendingDown, Swords, Gem, Zap } from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getAssetPath, getTownHallImage } from '@/lib/utils';

const StatCard = ({ icon: Icon, label, value, color }: { icon: React.ElementType, label: string, value: string | number, color?: string }) => (
    <Card className="bg-card/50">
        <CardContent className="p-4 flex items-center">
            <div className={`p-2 rounded-md mr-4 ${color || 'bg-primary/20'}`}>
                <Icon className={`h-6 w-6 ${color ? 'text-white' : 'text-primary'}`} />
            </div>
            <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-xl font-bold">{value}</p>
            </div>
        </CardContent>
    </Card>
);

const HeroCard = ({ hero }: { hero: any }) => (
    <Card className="bg-card/50 text-center">
        <CardContent className="p-3">
             <Image 
                src={getAssetPath('hero', hero.name)} 
                alt={hero.name}
                width={64} 
                height={64}
                className="mx-auto"
            />
            <p className="font-bold mt-2">{hero.name}</p>
            <p className="text-sm text-muted-foreground">Level {hero.level}</p>
        </CardContent>
    </Card>
);

const TroopCard = ({ troop }: { troop: any }) => (
     <Card className="bg-card/50 text-center relative">
        <CardContent className="p-2">
             <Image 
                src={getAssetPath('troop', troop.name)}
                alt={troop.name}
                width={48} 
                height={48}
                className="mx-auto"
            />
            <p className="font-semibold text-xs mt-1">{troop.name}</p>
            <p className="text-xs text-muted-foreground">Lvl {troop.level}</p>
        </CardContent>
    </Card>
)

const PlayerProfilePage = () => {
    const params = useParams();
    const playerTag = params.playerTag as string;
    const [playerData, setPlayerData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!playerTag) return;

        const fetchPlayerData = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/players/${playerTag}`);
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || 'Failed to fetch player data');
                }
                const data = await res.json();
                setPlayerData(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchPlayerData();
    }, [playerTag]);

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

    if (!playerData) {
        return <div className="text-muted-foreground text-center py-10">No player data found.</div>;
    }

    const { 
        name, tag, townHallLevel, townHallWeaponLevel, expLevel, league, trophies, bestTrophies, warStars, 
        donations, donationsReceived, clan, role, heroes, troops, spells 
    } = playerData;

    return (
        <div className="container mx-auto p-4 space-y-6">
            <Card className="bg-card/50 backdrop-blur-lg border border-white/10">
                <CardContent className="p-6 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
                    <Image 
                        src={getTownHallImage(townHallLevel, townHallWeaponLevel)} 
                        alt={`Town Hall ${townHallLevel}`}
                        width={128} 
                        height={128}
                    />
                    <div className="flex-grow text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start">
                            <h1 className="text-4xl font-bold text-white/90">{name}</h1>
                            {clan && <Badge variant="secondary" className="ml-4">{clan.name}</Badge>}
                        </div>
                        <p className="text-muted-foreground">{tag}</p>
                        <div className="flex items-center justify-center md:justify-start space-x-4 mt-2">
                           {league && <Image src={league.iconUrls.medium} alt={league.name} width={48} height={48} />}
                           <p className="text-xl font-semibold">{trophies} Trophies</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={Trophy} label="Best Trophies" value={bestTrophies} color="bg-yellow-500/20" />
                <StatCard icon={Star} label="War Stars" value={warStars} color="bg-orange-500/20" />
                <StatCard icon={TrendingUp} label="Donations" value={donations} color="bg-green-500/20" />
                <StatCard icon={TrendingDown} label="Received" value={donationsReceived} color="bg-red-500/20" />
            </div>

            <Card className="bg-card/50 backdrop-blur-lg border border-white/10">
                <CardHeader><CardTitle>Heroes</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {heroes.map((hero: any) => <HeroCard key={hero.name} hero={hero} />)}
                </CardContent>
            </Card>
            
            <Card className="bg-card/50 backdrop-blur-lg border border-white/10">
                <CardHeader><CardTitle>Troops & Spells</CardTitle></CardHeader>
                <CardContent>
                    <h3 className="text-lg font-semibold mb-2">Troops</h3>
                     <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                        {troops.map((troop: any) => <TroopCard key={troop.name} troop={troop} />)}
                    </div>
                    <h3 className="text-lg font-semibold mt-6 mb-2">Spells</h3>
                     <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                        {spells.map((spell: any) => <TroopCard key={spell.name} troop={spell} />)}
                    </div>
                </CardContent>
            </Card>

        </div>
    );
}

export default PlayerProfilePage; 