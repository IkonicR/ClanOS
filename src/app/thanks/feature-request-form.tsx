"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { ArrowRight, Sparkles, Lightbulb, MessageSquare, TrendingUp } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function FeatureRequestForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const userEmail = searchParams.get('email');
    if (userEmail) {
      setEmail(userEmail);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    if (!title) {
      toast({ title: 'Please provide a title for your idea.', variant: 'destructive' });
      setIsLoading(false);
      return;
    }
    if (!category) {
      toast({ title: 'Please select a category.', variant: 'destructive' });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/feature-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, category, email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong.');
      }
      
      toast({
        title: 'Feedback Submitted!',
        description: "We've received your idea. Thanks for helping us improve!",
        className: 'bg-green-500 text-white',
      });
      // Reset form
      setTitle('');
      setDescription('');
      setCategory('');
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
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))] -z-10"></div>
      
      <div className="max-w-2xl w-full mx-auto text-center animate-fade-in-up">
        <div className="inline-block bg-secondary/50 p-3 rounded-full mb-6 shadow-lg backdrop-blur-sm border border-border">
          <Sparkles className="w-8 h-8 text-landing-green" />
        </div>
        
        <h1 className="text-5xl md:text-6xl font-black tracking-tight">
          You&apos;re on the list!
        </h1>
        <p className="text-xl text-muted-foreground mt-4 max-w-lg mx-auto">
          Thank you for joining. While you wait, tell us what you want to see. Your feedback will shape the future of ClanOS.
        </p>

        <div className="mt-12 bg-secondary/30 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-2xl text-left">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-2">Your Email</label>
              <Input
                id="email"
                type="email"
                value={email}
                className="bg-background/80"
                readOnly
              />
            </div>
            
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-muted-foreground mb-2">Your Big Idea</label>
              <Input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Example: Automated War Attack Reminders"
                className="bg-background/80"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-muted-foreground mb-2">Tell us more</label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe how it would work and why it's useful..."
                className="bg-background/80 min-h-[120px]"
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-muted-foreground mb-2">Category</label>
               <Select onValueChange={setCategory} value={category}>
                <SelectTrigger className="w-full bg-background/80">
                  <SelectValue placeholder="Select a category..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="war-planning"><TrendingUp className="w-4 h-4 mr-2 inline-block" /> War & Strategy</SelectItem>
                  <SelectItem value="clan-management"><MessageSquare className="w-4 h-4 mr-2 inline-block" /> Clan Management</SelectItem>
                  <SelectItem value="analytics"><Lightbulb className="w-4 h-4 mr-2 inline-block" /> Analytics & Stats</SelectItem>
                  <SelectItem value="social"><Sparkles className="w-4 h-4 mr-2 inline-block" /> Social & Communication</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button type="submit" className="w-full text-lg py-6" disabled={isLoading}>
              {isLoading ? 'Submitting...' : 'Submit My Idea'}
              {!isLoading && <ArrowRight className="w-5 h-5 ml-2" />}
            </Button>
          </form>
        </div>
        
        <div className="mt-8">
            <Button variant="link" onClick={() => router.push('/dashboard')}>
                Skip and go to the app &rarr;
            </Button>
        </div>

      </div>
    </div>
  );
} 