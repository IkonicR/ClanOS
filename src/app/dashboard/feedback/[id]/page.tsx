'use client';

import { useState, useEffect, FormEvent, useCallback } from 'react';
import { useUser } from '@/lib/hooks/useUser';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
    id: number;
    content: string;
    created_at: string;
    author_name: string;
    author_avatar: string | null;
}

interface RequestDetails {
    id: number;
    title: string;
    description: string;
    comments: Comment[];
}

interface FeatureRequest {
    id: number;
    title: string;
    description: string;
}

export default function FeedbackDetail({ params }: { params: { id: string } }) {
    const [request, setRequest] = useState<RequestDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useUser();

    const fetchRequestDetails = useCallback(async () => {
        // Don't set loading to true here to prevent flicker on re-fetch
        try {
            const res = await fetch(`/api/feature-requests/${params.id}`);
            if (!res.ok) throw new Error('Failed to fetch details');
            const data = await res.json();
            setRequest(data);
        } catch (error) {
            toast({ title: 'Error', description: 'Could not load request details.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [params.id]);

    useEffect(() => {
        if (params.id) {
            setLoading(true);
            fetchRequestDetails();
        }
    }, [params.id, fetchRequestDetails]);

    const handleCommentSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !user) return;
        
        setIsSubmitting(true);

        const tempCommentId = Date.now();
        const optimisticComment: Comment = {
            id: tempCommentId,
            content: newComment,
            created_at: new Date().toISOString(),
            author_name: user.user_metadata.full_name || user.email,
            author_avatar: user.user_metadata.avatar_url,
        };
        
        setRequest(prev => prev ? { ...prev, comments: [...prev.comments, optimisticComment] } : null);
        setNewComment('');

        try {
            const res = await fetch(`/api/feature-requests/${params.id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: optimisticComment.content }),
            });
            if (!res.ok) throw new Error('Failed to post comment');
            
            // Re-fetch to get the real data, which will replace the optimistic comment
            await fetchRequestDetails(); 
        } catch (error) {
            toast({ title: 'Error', description: 'Could not post your comment.', variant: 'destructive' });
            // Revert on error
            setRequest(prev => prev ? { ...prev, comments: prev.comments.filter(c => c.id !== tempCommentId) } : null);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    if (!request) {
        return <div className="text-center py-10 text-muted-foreground">Request not found or failed to load.</div>;
    }

    return (
        <div className="flex flex-col h-full bg-background">
            <header className="p-6 border-b bg-secondary/50 rounded-t-lg">
                <h2 className="text-xl font-bold">{request.title}</h2>
                <p className="pt-2 text-sm text-muted-foreground">{request.description}</p>
            </header>
            <main className="flex-1 p-6 overflow-y-auto">
                <div className="space-y-6">
                    {request.comments.map((comment) => (
                        <div key={comment.id} className="flex items-start space-x-4">
                            <Avatar className="w-8 h-8">
                                <AvatarImage src={comment.author_avatar || ''} alt={comment.author_name} />
                                <AvatarFallback>{comment.author_name?.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 bg-secondary/30 p-3 rounded-lg">
                                <div className="flex items-center space-x-2">
                                    <p className="font-semibold text-sm">{comment.author_name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                    </p>
                                </div>
                                <p className="text-foreground text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
                            </div>
                        </div>
                    ))}
                     {request.comments.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">No comments yet. Be the first to share your thoughts!</p>
                    )}
                </div>
            </main>
             {user && (
                <footer className="p-6 border-t bg-secondary/50 rounded-b-lg">
                    <form onSubmit={handleCommentSubmit} className="flex items-start space-x-4">
                         <Avatar className="w-10 h-10">
                            <AvatarImage src={user?.user_metadata.avatar_url} />
                            <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <Textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Add a thoughtful comment..."
                                className="w-full bg-input"
                                rows={3}
                            />
                            <Button type="submit" className="mt-2" disabled={!newComment.trim() || isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Post Comment
                            </Button>
                        </div>
                    </form>
                </footer>
            )}
        </div>
    );
} 