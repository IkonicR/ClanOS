'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Post } from '@/lib/types';

interface Comment {
    id: string;
    content: string;
    created_at: string;
    profiles: {
        username: string;
        avatar_url: string;
    };
}

interface CommentSectionProps {
    post: Post;
}

export default function CommentSection({ post }: CommentSectionProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [showComments, setShowComments] = useState(false);

    useEffect(() => {
        if (showComments) {
            const fetchComments = async () => {
                const response = await fetch(`/api/posts/${post.id}/comments`);
                const data = await response.json();
                setComments(data);
            };
            fetchComments();
        }
    }, [showComments, post.id]);

    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        const response = await fetch(`/api/posts/${post.id}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: newComment }),
        });

        if (response.ok) {
            const createdComment = await response.json();
            setComments([...comments, createdComment]);
            setNewComment('');
        }
    };

    return (
        <div className="pt-4">
            <Button variant="link" onClick={() => setShowComments(!showComments)}>
                {showComments ? 'Hide comments' : 'View comments'}
            </Button>

            {showComments && (
                <div className="mt-4 space-y-4">
                    {comments.map((comment) => (
                        <div key={comment.id} className="flex items-start gap-3">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={comment.profiles.avatar_url} />
                                <AvatarFallback>{comment.profiles.username.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 rounded-lg bg-muted/50 p-3 text-sm">
                                <p className="font-semibold">{comment.profiles.username}</p>
                                <p>{comment.content}</p>
                            </div>
                        </div>
                    ))}
                    <form onSubmit={handleSubmitComment} className="flex items-center gap-3 pt-4">
                        <Input
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Write a comment..."
                            className="flex-1"
                        />
                        <Button type="submit">Post</Button>
                    </form>
                </div>
            )}
        </div>
    );
} 