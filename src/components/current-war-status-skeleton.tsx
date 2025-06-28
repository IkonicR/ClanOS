import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Swords } from "lucide-react";

export function CurrentWarStatusSkeleton() {
    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className='flex items-center gap-2'>
                    <Swords className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Current War</CardTitle>
                </div>
                 <div className="h-8 w-8 rounded-md bg-secondary/80 animate-pulse" />
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-center">
                 <div className="flex flex-col md:flex-row justify-between items-center mb-4 p-4 rounded-lg bg-secondary/80 animate-pulse">
                    {/* Clan Info Skeleton */}
                    <div className="flex flex-col items-center text-center md:items-start md:text-left">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-md bg-muted/50" />
                            <div className="w-24 h-6 rounded-md bg-muted/50" />
                        </div>
                        <div className="w-12 h-8 mt-1 rounded-md bg-muted/50" />
                        <div className="w-16 h-4 mt-1 rounded-md bg-muted/50" />
                    </div>
                    {/* Countdown Skeleton */}
                    <div className="flex flex-col items-center my-4 md:my-0">
                        <div className="w-28 h-9 rounded-md bg-muted/50" />
                        <div className="w-20 h-3 mt-1 rounded-md bg-muted/50" />
                    </div>
                    {/* Opponent Info Skeleton */}
                    <div className="flex flex-col items-center text-center md:items-end md:text-right">
                         <div className="flex items-center gap-2">
                            <div className="w-24 h-6 rounded-md bg-muted/50" />
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-md bg-muted/50" />
                        </div>
                        <div className="w-12 h-8 mt-1 rounded-md bg-muted/50" />
                        <div className="w-16 h-4 mt-1 rounded-md bg-muted/50" />
                    </div>
                </div>
                <Tabs defaultValue="feed" className="mt-6">
                    <TabsList className="grid w-full grid-cols-3">
                       <TabsTrigger value="feed" disabled>Attack Feed</TabsTrigger>
                       <TabsTrigger value="ourRoster" disabled>Our Roster</TabsTrigger>
                       <TabsTrigger value="theirRoster" disabled>Their Roster</TabsTrigger>
                    </TabsList>
                    <TabsContent value="feed" className="text-center text-muted-foreground p-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2">Loading War Data...</p>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
} 