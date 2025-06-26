"use client";

import { MoveRight, Shield, Users, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

export default function Home() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
      setAuthLoading(false);
    };

    getSession();
  }, [supabase.auth]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Email is required",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      toast({
        title: "Success!",
        description: data.message,
      });
      setEmail('');
    } catch (error: any) {
      toast({
        title: 'Uh oh! Something went wrong.',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <div className="absolute top-6 right-6 z-20 flex items-center gap-4">
        {!authLoading && (
          <>
            {user ? (
              <Button asChild variant="outline" className="bg-transparent hover:bg-white/10 hover:text-white">
                <Link href="/dashboard">Launch App</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="outline" className="bg-transparent hover:bg-white/10 hover:text-white">
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </>
        )}
      </div>
      {/* Animated background */}
      <div className="fixed inset-0 -z-20">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-black/50"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-landing-green/10 rounded-full mix-blend-lighten filter blur-2xl opacity-50 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-landing-green/10 rounded-full mix-blend-lighten filter blur-2xl opacity-50 animate-pulse delay-700"></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="fixed inset-0 -z-10 opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      </div>

      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-24 text-center">
        {/* Hero Section */}
        <div className="max-w-6xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-secondary/50 backdrop-blur-sm rounded-full px-6 py-3 mb-8 border border-border">
            <Shield className="w-4 h-4 text-landing-green" />
            <span className="text-sm font-medium text-white/80">The future of clan management is here.</span>
          </div>

          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black leading-none tracking-tight mb-8">
            <span className="bg-gradient-to-r from-landing-green to-white bg-clip-text text-transparent">
              ClanOS
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
            The operating system for every clan. Recruit elite members, coordinate epic wars, 
            and build an unstoppable empire with military precision.
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap gap-4 justify-center mb-16">
            <div className="flex items-center gap-2 bg-secondary/50 backdrop-blur-sm rounded-full px-4 py-2 border border-border">
              <Users className="w-4 h-4 text-landing-green" />
              <span className="text-sm text-secondary-foreground">Smart Recruiting</span>
            </div>
            <div className="flex items-center gap-2 bg-secondary/50 backdrop-blur-sm rounded-full px-4 py-2 border border-border">
              <Zap className="w-4 h-4 text-landing-green" />
              <span className="text-sm text-secondary-foreground">War Analytics</span>
            </div>
            <div className="flex items-center gap-2 bg-secondary/50 backdrop-blur-sm rounded-full px-4 py-2 border border-border">
              <Shield className="w-4 h-4 text-landing-green" />
              <span className="text-sm text-secondary-foreground">Member Tracking</span>
            </div>
          </div>

          {/* Waitlist Form */}
          <div className="max-w-md mx-auto">
            <div className="bg-secondary/50 backdrop-blur-lg rounded-2xl p-6 border border-border shadow-2xl">
              <h3 className="text-2xl font-bold mb-2 text-foreground">
                Join the Waitlist
              </h3>
              <p className="text-muted-foreground mb-6 text-sm">
                Get early access and be the first to know when we launch.
              </p>
              
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your-email@clash.com"
                  className="flex-1 bg-background/80 border border-input rounded-md px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-landing-green focus:ring-2 focus:ring-landing-green/20 transition-all text-sm"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  className="bg-landing-green hover:bg-opacity-90 text-background font-bold px-6 py-2 rounded-md transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-landing-green/10 hover:shadow-landing-green/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  {isLoading ? 'Joining...' : 'Get Early Access'}
                  {!isLoading && <MoveRight className="w-4 h-4" />}
                </button>
              </form>
            </div>
          </div>

          {/* Social Proof */}
          <div className="mt-16 flex flex-col items-center">
            <p className="text-muted-foreground/50 text-sm mb-4">Trusted by leaders from top clans worldwide</p>
            <div className="flex gap-8 opacity-50">
              <div className="text-2xl font-bold text-muted-foreground">#1 GLOBAL</div>
              <div className="text-2xl font-bold text-muted-foreground">500K+ MEMBERS</div>
              <div className="text-2xl font-bold text-muted-foreground">50+ COUNTRIES</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
