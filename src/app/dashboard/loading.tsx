import { Card, CardContent, CardHeader } from '@/components/ui/card';
import React from 'react';

export default function Loading() {
  return (
    <div>
      <div className="mb-8 space-y-3">
        <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-72 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 w-3/4 rounded-md bg-muted" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-4 w-full rounded-md bg-muted" />
              <div className="h-4 w-5/6 rounded-md bg-muted" />
              <div className="h-4 w-full rounded-md bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 