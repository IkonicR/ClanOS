import { Swords } from 'lucide-react';

export default function WarRoomPage() {
  return (
    <>
      <div className="flex items-center justify-between space-y-2 mb-4">
        <h2 className="text-3xl font-bold tracking-tight text-white/90">War Room</h2>
      </div>
       <div className="bg-card/75 backdrop-blur-lg border border-white/10 rounded-xl flex flex-col items-center justify-center p-16 text-center">
        <div className="p-6 bg-primary/10 rounded-full mb-4">
           <Swords className="h-12 w-12 text-primary" />
        </div>
        <h3 className="text-2xl font-bold tracking-tight text-white/90 mb-2">The Ultimate War Command Center</h3>
        <p className="text-muted-foreground max-w-md">
          Get ready to coordinate your clan&apos;s attacks with unmatched precision. Plan strategies, assign targets, and monitor war progress in real-time. Victory is imminent.
        </p>
      </div>
    </>
  );
} 