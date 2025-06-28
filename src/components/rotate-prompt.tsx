'use client';

import { useState, useEffect } from 'react';
import { Smartphone, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';

export function RotatePrompt({ onBack }: { onBack: () => void }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // This check is to prevent the prompt from ever showing on non-touch devices (i.e., desktops)
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!isTouchDevice) {
      return;
    }

    const checkOrientation = () => {
      // Show if in portrait mode on a touch-enabled device
      const isPortrait = window.innerHeight > window.innerWidth;
      setIsVisible(isPortrait);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-[999] bg-background flex flex-col items-center justify-center text-center p-4">
      <div className="p-4 bg-primary/10 rounded-full mb-4 animate-pulse">
        <Smartphone className="h-12 w-12 text-primary" />
      </div>
      <h3 className="text-xl font-bold tracking-tight text-foreground">Please Rotate Your Device</h3>
      <p className="text-muted-foreground mt-2 max-w-xs">
        This feature is best experienced in landscape mode for more space to plan your attack.
      </p>
      <Button onClick={onBack} variant="outline" className="mt-8">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Base List
      </Button>
    </div>
  );
} 