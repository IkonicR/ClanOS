'use client';

import React, { useState, useEffect } from 'react';
import { Swords, Star, Target, Clock, ArrowLeft } from 'lucide-react';
import { War, WarMember } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
// Removed tldraw import - using simple placeholder instead
import { Button } from '@/components/ui/button';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import { RotatePrompt } from '@/components/rotate-prompt';
import { PlanningCanvas } from '@/components/planning-canvas';

// Helper function to parse CoC API date strings
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

const Countdown = ({ endTime, title, isProminent, colorClass = 'text-destructive' }: { endTime: string, title: string, isProminent: boolean, colorClass?: string }) => {
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
            }
        };
        const timer = setInterval(calculateTimeLeft, 1000);
        calculateTimeLeft();
        return () => clearInterval(timer);
    }, [endTime]);

    if (!isProminent) {
        return <span className="text-xs font-mono text-muted-foreground">{title}: {timeLeft}</span>;
    }

    return (
        <div className="flex flex-col items-center">
            <span className={cn("text-2xl font-mono font-bold", colorClass)}>{timeLeft}</span>
            <span className="text-xs uppercase text-muted-foreground tracking-widest">{title}</span>
        </div>
    );
};

type WarData = War;

export function WarRoomClient() {
  const [war, setWar] = useState<WarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBase, setSelectedBase] = useState<WarMember | null>(null);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isLandscape = useMediaQuery("(orientation: landscape)");
  
  useEffect(() => {
    // Set the default size for tldraw shapes based on screen size
    if (isDesktop) {
      DefaultSizeStyle.setDefaultValue('m');
    } else {
      DefaultSizeStyle.setDefaultValue('xl');
    }
    // Revert to default when component unmounts
    return () => DefaultSizeStyle.setDefaultValue('m');
  }, [isDesktop]);

  const handleBaseSelect = (member: WarMember) => {
    if (!isDesktop) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    }
    setSelectedBase(member);
  };

  const handleExitCanvas = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    setSelectedBase(null);
  };

  useEffect(() => {
    async function fetchWarData() {
      try {
        const res = await fetch('/api/current-war');
        if (!res.ok) {
          throw new Error('Failed to fetch war data');
        }
        const data = await res.json();
        if (data.opponent && data.opponent.members) {
            data.opponent.members.sort((a: WarMember, b: WarMember) => a.mapPosition - b.mapPosition);
        }
        setWar(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchWarData();
  }, []);

  if (loading || !war || war.state === 'notInWar') {
     return (
       <div className="bg-card/75 backdrop-blur-lg border border-border rounded-xl flex flex-col items-center justify-center p-16 text-center h-full">
        <div className="p-6 bg-primary/10 rounded-full mb-4">
           <Swords className="h-12 w-12 text-primary" />
        </div>
        <h3 className="text-2xl font-bold tracking-tight text-foreground mb-2">Not Currently in War</h3>
        <p className="text-muted-foreground max-w-md">
          There is no active war to display. The War Room will be available when your clan enters a war.
        </p>
      </div>
     )
  }

  const { state, clan, opponent, teamSize, startTime, endTime } = war;
  const attacksRemaining = (teamSize * 2) - clan.attacks;

  const renderTimers = () => {
    if (state === 'preparation') {
        return (
            <>
                <Countdown endTime={startTime} title="War Starts In" isProminent={true} colorClass="text-primary" />
                <Countdown endTime={endTime} title="War Ends In" isProminent={false} />
            </>
        )
    }
     if (state === 'inWar') {
        return (
            <>
                <Countdown endTime={endTime} title="War Ends In" isProminent={true} />
                <Countdown endTime={startTime} title="War Started At" isProminent={false} />
            </>
        )
    }
    return null; // For warEnded or other states
  }

  const topStrip = (
      <div className="flex-shrink-0 bg-card/75 backdrop-blur-lg border-b border-border rounded-t-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
            <div className="flex items-center gap-2">
                <Clock className={cn("h-8 w-8", state === 'preparation' ? 'text-primary' : 'text-destructive')} />
                <div className="flex flex-col gap-1">
                    {renderTimers()}
                </div>
            </div>
            <div className="flex items-center gap-2 text-primary">
                <Star className="h-6 w-6 fill-primary" />
                <span className="text-xl font-bold">{clan.stars} / {teamSize * 3}</span>
            </div>
            <div className="flex items-center gap-2 text-foreground">
                <Target className="h-6 w-6" />
                <span className="text-xl font-bold">{attacksRemaining} / {teamSize * 2} Attacks Left</span>
            </div>
        </div>
        <div className="flex items-center gap-4 text-foreground/80 self-end sm:self-center">
            <span className="font-bold text-lg">{clan.destructionPercentage.toFixed(2)}%</span>
            <span className="text-sm text-muted-foreground">vs</span>
            <span className="font-bold text-lg">{opponent.destructionPercentage.toFixed(2)}%</span>
        </div>
      </div>
  );

  const baseList = (
    <div className="w-full lg:w-1/4 bg-background/50 border-b lg:border-b-0 lg:border-r border-border p-4 overflow-y-auto">
      <h3 className="text-xl font-bold tracking-tight text-foreground mb-4">Enemy Bases</h3>
      <div className="space-y-2">
        {opponent.members.map((member) => (
          <div
            key={member.tag}
            onClick={() => handleBaseSelect(member)}
            className={cn(
              "bg-card/75 p-3 rounded-lg border border-border cursor-pointer transition-all hover:border-primary/50",
              selectedBase?.tag === member.tag && "border-primary ring-2 ring-primary"
            )}
          >
            <div className="flex justify-between items-center">
              <p className="font-bold">
                #{member.mapPosition} - {member.name}
              </p>
              <span className="text-xs font-bold text-muted-foreground">
                TH{member.townhallLevel}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Not Assigned</p>
          </div>
        ))}
      </div>
    </div>
  );

  const planningView = (
    <div className="flex-1 bg-background/20 relative">
      {selectedBase && war ? (
          <PlanningCanvas war={war} selectedBase={selectedBase} isReadOnly={false} />
      ) : (
        <div className="hidden lg:flex items-center justify-center h-full">
          <div className="text-center">
            <h3 className="text-2xl font-bold tracking-tight text-foreground">Select a Base</h3>
            <p className="text-muted-foreground">Choose an enemy base from the list to start planning.</p>
          </div>
        </div>
      )}
    </div>
  );

  // On desktop, we always show the main layout with the base list and the planning view area.
  if (isDesktop) {
    return (
      <div className="flex flex-col h-full max-h-[calc(100vh-80px)]">
        {topStrip}
        <div className="flex flex-row flex-grow min-h-0">
          {baseList}
          {planningView}
        </div>
      </div>
    );
  }

  // On mobile, the view depends on whether a base is selected.
  if (!isDesktop) {
    // If a base is selected, show the fullscreen canvas.
    if (selectedBase) {
      return (
        <div className="fixed inset-0 bg-background z-50">
          <RotatePrompt onBack={handleExitCanvas} />
          <div className="w-full h-full">
            <PlanningCanvas war={war as WarData} selectedBase={selectedBase} isReadOnly={false} />
          </div>
        </div>
      );
    }

    // If no base is selected on mobile, show the top strip and the base list.
    return (
      <div className="flex flex-col h-full">
        {topStrip}
        {baseList}
      </div>
    );
  }

  // Fallback just in case, should not be reached.
  return null;
}

function WarRoomSkeleton() {
    return (
        <div className="flex flex-col h-full bg-card rounded-xl border border-border overflow-hidden">
            <div className="flex-shrink-0 bg-card/75 backdrop-blur-lg border-b border-border p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
                    <Skeleton className="h-12 w-32" />
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-32" />
                </div>
                <div className="flex items-center gap-4">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-16" />
                </div>
            </div>
            <div className="flex-grow flex">
                <div className="w-full lg:w-1/4 border-b lg:border-b-0 lg:border-r border-border p-4 space-y-2">
                    <Skeleton className="h-8 w-1/2 mb-4" />
                    {[...Array(15)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                    ))}
                </div>
                <div className="hidden lg:flex flex-1 items-center justify-center">
                    <div className="text-center">
                        <Target className="h-16 w-16 mx-auto text-muted-foreground/20" />
                        <p className="mt-4 text-lg font-semibold text-muted-foreground/50">Select a base to view the plan</p>
                    </div>
                </div>
            </div>
        </div>
    );
}