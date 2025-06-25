import { BarChart3 } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <>
      <div className="flex items-center justify-between space-y-2 mb-4">
        <h2 className="text-3xl font-bold tracking-tight text-white/90">Analytics</h2>
      </div>
       <div className="bg-card/75 backdrop-blur-lg border border-white/10 rounded-xl flex flex-col items-center justify-center p-16 text-center">
        <div className="p-6 bg-primary/10 rounded-full mb-4">
           <BarChart3 className="h-12 w-12 text-primary" />
        </div>
        <h3 className="text-2xl font-bold tracking-tight text-white/90 mb-2">Advanced Analytics Coming Soon</h3>
        <p className="text-muted-foreground max-w-md">
            Get ready for deep insights into your clan&apos;s performance. We&apos;re building powerful analytics to track war results, member activity, donations, and more.
        </p>
      </div>
    </>
  );
} 