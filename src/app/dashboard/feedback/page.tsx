'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowUp, MessageSquare, PlusCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/lib/hooks/useUser';
import { FeedbackSettings } from '@/components/feedback-settings';
import { toast } from '@/components/ui/use-toast';
import FeedbackDetail from './[id]/page';
import { FEATURE_REQUEST_CATEGORIES } from '@/lib/constants';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';

interface FeatureRequest {
  id: number;
  title: string;
  description: string;
  category: string;
  vote_count: number;
  user_voted: boolean;
  comments_count: number;
}

function FeedbackList() {
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [votingId, setVotingId] = useState<number | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const { user } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const category = searchParams.get('category');

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const url = category ? `/api/feature-requests?category=${category}` : '/api/feature-requests';
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      toast({ title: 'Error', description: 'Could not load feature requests.', variant: 'destructive' });
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleCommentAdded = (requestId: number) => {
    setRequests(currentRequests =>
      currentRequests.map(r =>
        r.id === requestId
          ? { ...r, comments_count: (r.comments_count ?? 0) + 1 }
          : r
      )
    );
  };

  const handleVote = async (e: React.MouseEvent, requestId: number) => {
    e.stopPropagation();
    if (!user) {
      toast({ title: 'Login required', description: 'You must be logged in to vote.' });
      return;
    }

    setVotingId(requestId);

    const originalRequests = [...requests];
    const request = requests.find(r => r.id === requestId);
    if (!request) return;

    const newVoteState = !request.user_voted;
    const newVoteCount = request.vote_count + (newVoteState ? 1 : -1);

    setRequests(currentRequests =>
      currentRequests.map(r =>
        r.id === requestId ? { ...r, user_voted: newVoteState, vote_count: newVoteCount } : r
      )
    );

    try {
      const method = newVoteState ? 'POST' : 'DELETE';
      const res = await fetch(`/api/feature-requests/vote?request_id=${requestId}`, { method });

      if (!res.ok) {
        setRequests(originalRequests);
        toast({ title: 'Error', description: 'Your vote could not be counted.', variant: 'destructive' });
      }
    } catch (error) {
      setRequests(originalRequests);
      toast({ title: 'Error', description: 'A network error occurred.', variant: 'destructive' });
    } finally {
      setVotingId(null);
    }
  };

  const handleCategoryFilter = (newCategory: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newCategory) {
      params.set('category', newCategory);
    } else {
      params.delete('category');
    }
    router.push(`/dashboard/feedback?${params.toString()}`);
  };
  
  const selectedRequest = requests.find(r => r.id === selectedRequestId) || null;

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse bg-secondary/50">
            <CardHeader><div className="h-6 bg-muted rounded w-3/4"></div></CardHeader>
            <CardContent><div className="h-4 bg-muted rounded w-full mb-2"></div><div className="h-4 bg-muted rounded w-5/6"></div></CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-6">
        <Button variant={!category ? 'secondary' : 'outline'} onClick={() => handleCategoryFilter(null)}>All</Button>
        {FEATURE_REQUEST_CATEGORIES.map(c => (
          <Button key={c} variant={category === c ? 'secondary' : 'outline'} onClick={() => handleCategoryFilter(c)}>{c}</Button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {requests.map((request) => (
          <Card key={request.id} onClick={() => setSelectedRequestId(request.id)} className="cursor-pointer group flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-secondary/30 border">
            <CardHeader>
              <CardTitle className="text-base font-semibold leading-snug">{request.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <Badge variant="outline">{request.category}</Badge>
            </CardContent>
            <div className="flex justify-between items-center p-4 mt-auto border-t">
              <Button
                 variant="ghost"
                 onClick={(e) => handleVote(e, request.id)}
                 className={`flex items-center gap-2 h-auto text-sm transition-colors rounded-full px-3 py-1 ${request.user_voted ? 'btn-premium' : 'text-muted-foreground hover:text-foreground'}`}
                 disabled={votingId === request.id}
              >
                {votingId === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
                <span>{request.vote_count ?? 0}</span>
              </Button>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MessageSquare className="h-4 w-4" />
                <span>{request.comments_count ?? 0}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      <Dialog open={!!selectedRequest} onOpenChange={(isOpen) => !isOpen && setSelectedRequestId(null)}>
        <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0">
          {selectedRequest && <FeedbackDetail params={{ id: selectedRequest.id.toString() }} onCommentAdded={() => handleCommentAdded(selectedRequest.id)} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function FeedbackPage() {
  const { user } = useUser();

  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin" /></div>}>
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Feedback Board</h1>
            <p className="mt-2 text-muted-foreground">Voice your ideas and shape the future of our clan.</p>
          </div>
          {user && (
            <Button asChild className="shrink-0">
              <Link href="/dashboard/feedback/new">
                <PlusCircle className="mr-2 h-4 w-4" /> Submit Idea
              </Link>
            </Button>
          )}
        </div>

        <Tabs defaultValue="all-ideas" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="all-ideas">All Ideas</TabsTrigger>
            <TabsTrigger value="my-ideas">My Ideas</TabsTrigger>
          </TabsList>
          <TabsContent value="all-ideas" className="mt-6">
            <FeedbackList />
          </TabsContent>
          <TabsContent value="my-ideas" className="mt-6">
            {user ? <FeedbackSettings email={user.email!} /> : <p>Please log in to see your submitted ideas.</p>}
          </TabsContent>
        </Tabs>
      </div>
    </Suspense>
  );
}
