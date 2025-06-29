'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/lib/hooks/useUser';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Post, Comment, Profile } from '@/lib/types';

interface CommentSectionProps {
    post: Post;
    onCommentPosted: () => void;
}

export default function CommentSection({ post, onCommentPosted }: CommentSectionProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useUser();
    const [profile, setProfile] = useState<Profile | null>(null);
    const supabase = createClient();

    const fetchComments = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/posts/${post.id}/comments`);
            if (!response.ok) {
                throw new Error('Failed to fetch comments');
            }
            const data = await response.json();
            setComments(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchUserProfile = async () => {
            if (user) {
                const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                setProfile(data);
            }
        };

        fetchComments();
        fetchUserProfile();

        const channel = supabase
            .channel(`comments:${post.id}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments', filter: `post_id=eq.${post.id}` }, 
                (payload) => {
                    // Refetch comments to get the new comment with the profile
                    fetchComments();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [post.id, supabase, user]);

    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !user || !profile) return;

        setIsSubmitting(true);

        const optimisticComment: Comment = {
            id: crypto.randomUUID(),
            post_id: post.id,
            user_id: user.id,
            content: newComment,
            created_at: new Date().toISOString(),
            profiles: {
                username: profile.username!,
                avatar_url: profile.avatar_url ?? null,
            },
        };

        setComments((currentComments) => [...currentComments, optimisticComment]);
        
        const response = await fetch(`/api/posts/${post.id}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: newComment }),
        });

        if (!response.ok) {
            console.error('Error posting comment:');
            // Revert optimistic update
            setComments((currentComments) => currentComments.filter((c) => c.id !== optimisticComment.id));
        } else {
            onCommentPosted();
        }

        setNewComment('');
        setIsSubmitting(false);
    };

    return (
        <div className="w-full pt-4">
            <div className="space-y-4 px-4">
                {loading ? (
                    <p>Loading comments...</p>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className="flex items-start gap-3">
                            <Avatar className="w-8 h-8">
                                <AvatarImage src={comment.profiles?.avatar_url ?? undefined} />
                                <AvatarFallback>{comment.profiles?.username?.charAt(0) ?? '?'}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <p className="font-semibold text-sm">{comment.profiles?.username ?? 'Unknown User'}</p>
                                    <p className="text-xs text-muted-foreground">{new Date(comment.created_at).toLocaleString()}</p>
                                </div>
                                <p className="text-sm">{comment.content}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <form onSubmit={handleSubmitComment} className="mt-4 flex gap-2 border-t p-4">
                <Input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    disabled={isSubmitting}
                />
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Posting...' : 'Post'}
                </Button>
            </form>
        </div>
    );
} 