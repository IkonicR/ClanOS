"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { ArrowRight, Lightbulb, MessageSquare, Sparkles, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';

interface FeatureRequestFormProps {
  email: string;
  onSuccess?: () => void;
}

export default function FeatureRequestForm({ email, onSuccess }: FeatureRequestFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    if (!title || !category) {
      toast({ title: 'Title and category are required.', variant: 'destructive' });
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
      if (!response.ok) throw new Error(data.error || 'Something went wrong.');
      
      toast({
        title: 'Feedback Submitted!',
        description: "We've received your idea. Thanks for helping us improve!",
        className: 'bg-green-500 text-white',
      });
      
      // Reset form and call success callback
      setTitle('');
      setDescription('');
      setCategory('');
      if(onSuccess) onSuccess();

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
    <Card>
      <CardHeader>
        <CardTitle>Submit an Idea</CardTitle>
        <CardDescription>Have a feature request or an idea to improve the app? Let us know!</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
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
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full text-lg py-6" disabled={isLoading}>
            {isLoading ? 'Submitting...' : 'Submit My Idea'}
            {!isLoading && <ArrowRight className="w-5 h-5 ml-2" />}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
} 