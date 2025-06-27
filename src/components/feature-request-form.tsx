"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { ArrowRight, Lightbulb, MessageSquare, Sparkles, TrendingUp, ArrowLeft } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';
import { Label } from '@/components/ui/label';
import { FEATURE_REQUEST_CATEGORIES } from '@/lib/constants';

interface FeatureRequest {
    id: number;
    title: string;
    description: string;
    category: string;
    created_at: string;
}

interface FeatureRequestFormProps {
  email: string;
  onSuccess?: (request: FeatureRequest) => void;
  isEditMode?: boolean;
  request?: FeatureRequest;
  onCancel?: () => void;
}

export default function FeatureRequestForm({ email, onSuccess, isEditMode = false, request, onCancel }: FeatureRequestFormProps) {
  const [title, setTitle] = useState(request?.title || '');
  const [description, setDescription] = useState(request?.description || '');
  const [category, setCategory] = useState(request?.category || 'General');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isEditMode && request) {
      setTitle(request.title);
      setDescription(request.description);
      setCategory(request.category);
    }
  }, [isEditMode, request]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    if (!title || !category) {
      toast({ title: 'Title and category are required.', variant: 'destructive' });
      setIsLoading(false);
      return;
    }

    const payload = { id: request?.id, title, description, category, email };

    try {
      const response = await fetch('/api/feature-requests', {
        method: isEditMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Something went wrong.');
      
      toast({
        title: isEditMode ? 'Idea Updated!' : 'Feedback Submitted!',
        description: isEditMode ? "Your changes have been saved." : "We've received your idea. Thanks for helping us improve!",
        className: 'bg-green-500 text-white',
      });
      
      if (!isEditMode) {
        setTitle('');
        setDescription('');
        setCategory('');
      }
      if (onSuccess) onSuccess(data);

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
        {isEditMode && onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel} className="absolute top-4 left-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
            </Button>
        )}
        <CardTitle>{isEditMode ? 'Edit Your Idea' : 'Submit an Idea'}</CardTitle>
        <CardDescription>{isEditMode ? 'Refine your suggestion and save the changes.' : 'Have a feature request or an idea to improve the app? Let us know!'}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Idea Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Better Troop Donation UI" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your idea in a bit more detail..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {FEATURE_REQUEST_CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full text-lg py-6 btn-premium"
            disabled={isLoading}
          >
            {isLoading ? (isEditMode ? 'Saving...' : 'Submitting...') : (isEditMode ? 'Save Changes' : 'Submit My Idea')}
            {!isLoading && <ArrowRight className="w-5 h-5 ml-2" />}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
} 