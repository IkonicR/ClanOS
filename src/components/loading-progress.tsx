'use client';

import React from 'react';
import { Progress } from '@/components/ui/progress';

interface LoadingProgressProps {
  progress?: number;
  message?: string;
}

export function LoadingProgress({ progress = 0, message = "Loading..." }: LoadingProgressProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center space-x-3">
          <div className="flex-1">
            <Progress value={progress} className="h-2" />
          </div>
          <span className="text-sm text-muted-foreground">{message}</span>
        </div>
      </div>
    </div>
  );
}
