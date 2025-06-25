'use client';

import React, { useEffect, useState, useOptimistic } from 'react';
import CreatePost from '@/components/create-post';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageCircle, Heart, Share } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { Post } from '@/lib/types';
import CommentSection from '@/components/comment-section';

const ClanFeedPage = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const supabase = createClient();

    useEffect(() => {
        const fetchUser = async () => {
            const { data } = await supabase.auth.getUser();
            setUser(data.user);
        };
        fetchUser();

        const fetchPosts = async () => {
            try {
                const response = await fetch('/api/clan-feed');
                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('API Error:', errorData);
                    throw new Error('Failed to fetch posts');
                }
                const data = await response.json();
                setPosts(data);
            } catch (error) {
                console.error('Failed to fetch posts:', error);
                setPosts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();

        const channel = supabase
            .channel('realtime posts')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'posts' },
                (payload) => {
                    fetchPosts(); // Refetch posts on any change
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'likes' },
                (payload) => {
                    fetchPosts(); // Refetch posts on any change
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'comments' },
                (payload) => {
                    fetchPosts(); // Refetch posts on any change
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase]);

    const [optimisticPosts, setOptimisticPosts] = useOptimistic(
        posts,
        (state: Post[], { postId, isLiked, likes }: { postId: string, isLiked: boolean, likes: number }) => {
            return state.map(post =>
                post.id === postId ? { ...post, user_has_liked_post: isLiked, like_count: likes } : post
            );
        }
    );

    const handleLikeToggle = async (post: Post) => {
        const newIsLiked = !post.user_has_liked_post;
        const newLikesCount = newIsLiked ? post.like_count + 1 : post.like_count - 1;

        setOptimisticPosts({ postId: post.id, isLiked: newIsLiked, likes: newLikesCount });

        await fetch(`/api/posts/${post.id}/like`, {
            method: newIsLiked ? 'POST' : 'DELETE',
        });
    };

    const handleCreatePost = (newPost: Post) => {
        setPosts([newPost, ...posts]);
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Clan Feed</h1>
            <div className="mb-8">
                <CreatePost onCreatePost={handleCreatePost} />
            </div>
            {loading ? (
                <div className="space-y-6">
                    {/* Skeleton Loader */}
                    {[...Array(3)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader className="flex flex-row items-center gap-4">
                                <div className="w-10 h-10 bg-muted rounded-full animate-pulse" />
                                <div className="space-y-2">
                                    <div className="h-4 bg-muted w-24 rounded animate-pulse" />
                                    <div className="h-3 bg-muted w-32 rounded animate-pulse" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="h-4 bg-muted w-full rounded animate-pulse" />
                                    <div className="h-4 bg-muted w-5/6 rounded animate-pulse" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="space-y-6">
                    {optimisticPosts.map((post) => (
                        <Card key={post.id}>
                            <CardHeader className="flex flex-row items-center gap-4">
                                <Avatar>
                                    <AvatarImage src={post.profiles?.avatar_url ?? undefined} />
                                    <AvatarFallback>{post.profiles?.username.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{post.profiles?.username}</p>
                                    <p className="text-sm text-muted-foreground">{new Date(post.created_at).toLocaleString()}</p>
                                </div>
                                {user?.id === post.user_id && (
                                    <div className="ml-auto">
                                        {/* Add dropdown for edit/delete here */}
                                    </div>
                                )}
                            </CardHeader>
                            <CardContent>
                                <p>{post.content}</p>
                            </CardContent>
                            <div className="border-t border-muted">
                                <CommentSection post={post} />
                            </div>
                            <CardFooter className="flex justify-between pt-4">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="flex items-center gap-2"
                                    onClick={() => handleLikeToggle(post)}
                                >
                                    <Heart
                                        className={`w-4 h-4 ${post.user_has_liked_post ? 'text-red-500 fill-current' : ''}`}
                                    />
                                    <span>{post.like_count}</span>
                                </Button>
                                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                                    <MessageCircle className="w-4 h-4" />
                                    <span>Comment</span>
                                </Button>
                                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                                    <Share className="w-4 h-4" />
                                    <span>Share</span>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ClanFeedPage; 