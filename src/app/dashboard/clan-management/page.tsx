import { ShieldCheck } from 'lucide-react';

export default function ClanManagementPage() {
  return (
    <>
      <div className="flex items-center justify-between space-y-2 mb-4">
        <h2 className="text-3xl font-bold tracking-tight text-white/90">Clan Management</h2>
      </div>
       <div className="bg-card/75 backdrop-blur-lg border border-white/10 rounded-xl flex flex-col items-center justify-center p-16 text-center">
        <div className="p-6 bg-primary/10 rounded-full mb-4">
           <ShieldCheck className="h-12 w-12 text-primary" />
        </div>
        <h3 className="text-2xl font-bold tracking-tight text-white/90 mb-2">Total Clan Control on the Horizon</h3>
        <p className="text-muted-foreground max-w-md">
            Soon you'll be able to manage members, promotions, and clan settings directly from here. Automate recruitment, track participation, and build a stronger clan with ease.
        </p>
      </div>
    </>
  );
} 