import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 text-landing-green animate-spin" />
        <p className="text-muted-foreground">Loading your personalized welcome...</p>
      </div>
    </div>
  );
} 