'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function NavigationLoading() {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card p-6 rounded-lg border shadow-lg max-w-sm w-full mx-4">
        <div className="flex items-center space-x-3">
          <Skeleton className="w-6 h-6 rounded-full animate-spin" />
          <div className="flex-1">
            <Skeleton className="h-5 w-24 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-2 w-3/4" />
        </div>
      </div>
    </div>
  );
}
