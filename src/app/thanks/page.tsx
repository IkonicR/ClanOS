"use client";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { FeedbackSettings } from '@/components/feedback-settings';
import { Sparkles } from 'lucide-react';

function ThanksContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  if (!email) {
    return (
        <div className="max-w-2xl w-full mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-black tracking-tight">Thank You!</h1>
            <p className="text-xl text-muted-foreground mt-4">We've received your submission.</p>
        </div>
    );
  }

  return (
    <div className="max-w-2xl w-full mx-auto text-center">
        <div className="inline-block bg-secondary/50 p-3 rounded-full mb-6 shadow-lg backdrop-blur-sm border border-border">
            <Sparkles className="w-8 h-8 text-landing-green" />
        </div>
        
        <h1 className="text-5xl md:text-6xl font-black tracking-tight">
            You&apos;re on the list!
        </h1>
        <p className="text-xl text-muted-foreground mt-4 max-w-lg mx-auto">
            We&apos;ll email you an invite soon. While you wait, your feedback will shape the future of ClanOS.
        </p>

        <div className="mt-12 text-left">
            <FeedbackSettings email={email} />
        </div>
    </div>
  );
}


export default function ThanksPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))] -z-10"></div>
        <Suspense>
            <ThanksContent />
        </Suspense>
    </div>
  );
} 