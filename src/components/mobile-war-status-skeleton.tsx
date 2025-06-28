import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Swords } from "lucide-react";

export function MobileWarStatusSkeleton() {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Swords className="h-5 w-5 text-primary" />
                    War Status
                </CardTitle>
                <div className="h-8 w-8 rounded-md bg-secondary/80 animate-pulse" />
            </CardHeader>
            <CardContent className="pt-4">
                <div className="h-20 w-full rounded-md bg-secondary/80 animate-pulse" />
            </CardContent>
        </Card>
    )
} 