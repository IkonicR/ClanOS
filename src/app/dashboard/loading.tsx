import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="container mx-auto p-2 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between space-y-2 mb-4">
        <Skeleton className="h-8 w-48" />
      </div>

      {/* Clan Overview Skeleton */}
      <div className="mb-6">
        <Card className="bg-card/75 backdrop-blur-lg border border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4 mb-4">
              <Skeleton className="w-16 h-16 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <Skeleton className="h-8 w-16 mx-auto mb-1" />
                <Skeleton className="h-4 w-20 mx-auto" />
              </div>
              <div className="text-center">
                <Skeleton className="h-8 w-16 mx-auto mb-1" />
                <Skeleton className="h-4 w-20 mx-auto" />
              </div>
              <div className="text-center">
                <Skeleton className="h-8 w-16 mx-auto mb-1" />
                <Skeleton className="h-4 w-20 mx-auto" />
              </div>
              <div className="text-center">
                <Skeleton className="h-8 w-16 mx-auto mb-1" />
                <Skeleton className="h-4 w-20 mx-auto" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <Card className="bg-card/75 backdrop-blur-lg border border-white/10">
            <CardContent className="p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-3">
          <Card className="bg-card/75 backdrop-blur-lg border border-white/10">
            <CardContent className="p-6">
              <Skeleton className="h-6 w-40 mb-4" />
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-6 w-12" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 