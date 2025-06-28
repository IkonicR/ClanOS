import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { Users, Trophy, Award, Flame, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Clan } from '@/lib/types';
import { Button } from '@/components/ui/button';

type ClanInfoForCard = Clan & {
    warLeague: { name: string };
    warWinStreak: number;
    members: number;
    clanPoints: number;
    clanVersusPoints: number;
    requiredTrophies: number;
};

interface ClanOverviewCardProps {
    clanInfo: ClanInfoForCard;
}

const WarStreakFlame = ({ streak }: { streak: number }) => {
    const getFlameStyle = (baseColor: string, delay: string) => {
        return cn(baseColor, 'animate-flame-dance', 'transition-all duration-500');
    };

    const baseStyle = "h-7 w-7";

    return (
        <div className="flex flex-col items-center justify-center p-4 bg-secondary/50 rounded-lg text-center h-full">
             <div className="relative flex items-center justify-center h-8">
                {streak >= 5 && <Flame className={cn(baseStyle, getFlameStyle('text-yellow-500', 'delay-0'))} />}
                {streak >= 15 && <Flame className={cn(baseStyle, 'absolute', getFlameStyle('text-orange-500', 'delay-200'))} style={{ animationDelay: '0.2s', transform: 'translateX(-8px) scale(0.9) rotate(-15deg)' }} />}
                {streak >= 25 && <Flame className={cn(baseStyle, 'absolute', getFlameStyle('text-red-500', 'delay-500'))} style={{ animationDelay: '0.5s', transform: 'translateX(8px) scale(0.9) rotate(15deg)' }} />}
                {streak < 5 && <Flame className="h-7 w-7 text-muted-foreground/50" />}
            </div>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mt-1">War Streak</p>
            <p className="text-xl font-bold">{streak}</p>
        </div>
    );
};

const StatItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | number }) => (
    <div className="flex flex-col items-center justify-center p-4 bg-secondary/50 rounded-lg text-center h-full">
        <Icon className={cn("h-6 w-6 text-primary mb-2")} />
        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{label}</p>
        <p className="text-xl font-bold">{value}</p>
    </div>
);

export const ClanOverviewCard = ({ clanInfo }: ClanOverviewCardProps) => {
    return (
        <Card className="bg-card/75 backdrop-blur-lg border-white/10 relative">
             <Link href="/dashboard/clan-profile" passHref>
                <Button variant="ghost" size="icon" className="absolute top-4 right-4">
                    <Eye className="h-5 w-5" />
                </Button>
            </Link>
            <CardHeader className="flex flex-col md:flex-row items-center gap-4">
                <Image src={clanInfo.badgeUrls.medium} alt="Clan Badge" width={80} height={80} className="rounded-lg" />
                <div className="text-center md:text-left">
                    <CardTitle className="text-3xl font-bold">{clanInfo.name}</CardTitle>
                    <CardDescription className="text-lg text-muted-foreground">
                        Level {clanInfo.clanLevel} • {clanInfo.warLeague.name}
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatItem icon={Users} label="Members" value={`${clanInfo.members || 0} / 50`} />
                    <WarStreakFlame streak={clanInfo.warWinStreak || 0} />
                    <StatItem icon={Trophy} label="Clan Trophies" value={(clanInfo.clanPoints || 0).toLocaleString()} />
                    <StatItem icon={Award} label="Required" value={(clanInfo.requiredTrophies || 0).toLocaleString()} />
                </div>
            </CardContent>
        </Card>
    );
}; 