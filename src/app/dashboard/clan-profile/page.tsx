'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { createClient } from '@/lib/supabase/client';
import {
  Users,
  Trophy,
  Target,
  Crown,
  Shield,
  Star,
  TrendingUp,
  MapPin,
  Calendar,
  Award,
  Swords
} from 'lucide-react';

export default function ClanProfilePage() {
  const [clanData, setClanData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchClanData = async () => {
      try {
        // Get user's profile to find clan tag
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get user's profile with clan tag
        const { data: profile } = await supabase
          .from('profiles')
          .select('clan_tag')
          .eq('id', user.id)
          .single();

        if (!profile?.clan_tag) return;

        // Fetch clan data from API
        const response = await fetch(`/api/clan-members?clanTag=${encodeURIComponent(profile.clan_tag)}`);
        if (response.ok) {
          const data = await response.json();
          setClanData(data);
        }
      } catch (error) {
        console.error('Error fetching clan data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClanData();
  }, [supabase]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 w-3/4 rounded-md bg-muted" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-4 w-full rounded-md bg-muted" />
                <div className="h-4 w-5/6 rounded-md bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!clanData) {
    return (
      <div className="text-center space-y-4">
        <Shield className="w-16 h-16 mx-auto text-muted-foreground" />
        <h2 className="text-2xl font-bold">No Clan Data Available</h2>
        <p className="text-muted-foreground">
          Unable to load clan information. Please check your clan settings.
        </p>
      </div>
    );
  }

  const { clanInfo, memberList } = clanData;

  // Calculate statistics
  const avgTownHall = Math.round(
    memberList.reduce((acc: number, member: any) => acc + member.townHallLevel, 0) / memberList.length
  );

  const totalTrophies = memberList.reduce((acc: number, member: any) => acc + member.trophies, 0);
  const avgTrophies = Math.round(totalTrophies / memberList.length);

  const roleDistribution = memberList.reduce((acc: any, member: any) => {
    acc[member.role] = (acc[member.role] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Clan Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <Avatar className="w-20 h-20">
              <AvatarImage src={clanInfo.badgeUrls.medium} alt={clanInfo.name} />
              <AvatarFallback>
                <Shield className="w-10 h-10" />
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-3xl font-bold">{clanInfo.name}</h1>
                <p className="text-muted-foreground flex items-center gap-2 mt-1">
                  <MapPin className="w-4 h-4" />
                  {clanInfo.location?.name || 'Location Unknown'}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  <Users className="w-3 h-3 mr-1" />
                  {clanInfo.members}/50 Members
                </Badge>
                <Badge variant="outline">
                  <Crown className="w-3 h-3 mr-1" />
                  Level {clanInfo.clanLevel}
                </Badge>
                <Badge variant="outline">
                  <Trophy className="w-3 h-3 mr-1" />
                  {clanInfo.clanPoints.toLocaleString()} Points
                </Badge>
              </div>

              {clanInfo.description && (
                <p className="text-sm text-muted-foreground">
                  {clanInfo.description}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Town Hall</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgTownHall}</div>
            <p className="text-xs text-muted-foreground">TH14 max</p>
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
            <CardTitle className="text-sm font-medium">War League</CardTitle>
            <Swords className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">{clanInfo.warLeague?.name || 'Unranked'}</div>
            <p className="text-xs text-muted-foreground">{clanInfo.warWinStreak} win streak</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">War Frequency</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">{clanInfo.warFrequency}</div>
            <p className="text-xs text-muted-foreground">Weekly wars</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Member Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Leaders</span>
                  <Badge variant="default">{roleDistribution.leader || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Co-Leaders</span>
                  <Badge variant="secondary">{roleDistribution.coLeader || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Elders</span>
                  <Badge variant="outline">{roleDistribution.elder || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Members</span>
                  <Badge variant="outline">{roleDistribution.member || 0}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Min Trophies</span>
                  <span className="font-medium">{clanInfo.requiredTrophies.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Min Town Hall</span>
                  <span className="font-medium">TH{clanInfo.requiredTownhallLevel}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Clan Type</span>
                  <Badge variant={clanInfo.type === 'open' ? 'default' : 'secondary'}>
                    {clanInfo.type}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Members ({memberList.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {memberList
                  .sort((a: any, b: any) => b.trophies - a.trophies)
                  .slice(0, 20)
                  .map((member: any, index: number) => (
                    <div key={member.tag} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium w-6">#{index + 1}</span>
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={member.league?.iconUrls?.small} />
                          <AvatarFallback>
                            <Crown className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{member.name}</p>
                          <p className="text-xs text-muted-foreground">
                            TH{member.townHallLevel} • {member.role}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{member.trophies.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">
                          {member.donations} donations
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Recent Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Trophy className="h-8 w-8 text-yellow-500" />
                    <div>
                      <p className="text-sm font-medium">Most Valuable Clan</p>
                      <p className="text-xs text-muted-foreground">Reached 2000+ points</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Star className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">War Champions</p>
                      <p className="text-xs text-muted-foreground">5 consecutive wins</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Crown className="h-8 w-8 text-purple-500" />
                    <div>
                      <p className="text-sm font-medium">Clan Games Winner</p>
                      <p className="text-xs text-muted-foreground">Top 100 worldwide</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Clan Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Points Progress</span>
                    <span>{clanInfo.clanPoints.toLocaleString()}</span>
                  </div>
                  <Progress value={Math.min(clanInfo.clanPoints / 5000 * 100, 100)} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Versus Points</span>
                    <span>{clanInfo.clanVersusPoints.toLocaleString()}</span>
                  </div>
                  <Progress value={Math.min(clanInfo.clanVersusPoints / 2000 * 100, 100)} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
