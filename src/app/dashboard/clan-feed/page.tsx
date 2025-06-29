'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import CreatePost from '@/components/create-post';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageCircle, Heart, Share, MoreHorizontal } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { Post } from '@/lib/types';
import CommentSection from '@/components/comment-section';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type FeedType = 'my-clan' | 'global' | 'group';

const ClanFeedPage = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [editingPostId, setEditingPostId] = useState<string | null>(null);
    const [editedContent, setEditedContent] = useState('');
    const [page, setPage] = useState(1);
    const [hasMorePosts, setHasMorePosts] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [activeFeed, setActiveFeed] = useState<FeedType>('my-clan');
    const supabase = createClient();
    const { ref, inView } = useInView({
        threshold: 0,
        triggerOnce: false
    });

    const fetchPosts = async (pageNum: number, initialLoad = false) => {
        if (isFetchingMore && !initialLoad) return;
        if(initialLoad) setLoading(true);
        setIsFetchingMore(true);

        try {
            const response = await fetch(`/api/clan-feed?page=${pageNum}&feed_type=${activeFeed}`);
            if (!response.ok) throw new Error('Failed to fetch posts');
            
            const newPosts = await response.json();
            setPosts(prevPosts => pageNum === 1 ? newPosts : [...prevPosts, ...newPosts]);
            setHasMorePosts(newPosts.length > 0);
        } catch (error) {
            console.error('Failed to fetch posts:', error);
        } finally {
            if(initialLoad) setLoading(false);
            setIsFetchingMore(false);
        }
    };

    // Fetch user once on mount
    useEffect(() => {
        const fetchUser = async () => {
            const { data } = await supabase.auth.getUser();
            setUser(data.user);
        };
        fetchUser();
    }, [supabase]);

    // Fetch posts when activeFeed changes
    useEffect(() => {
        fetchPosts(1, true);
    }, [activeFeed]);

    useEffect(() => {
        if (inView && hasMorePosts && !isFetchingMore && !loading) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchPosts(nextPage);
        }
    }, [inView, hasMorePosts, isFetchingMore, loading, page, activeFeed]);
    
    useEffect(() => {
        if (!user?.id) return; // Don't set up subscriptions until we have a user

        const postsChannel = supabase.channel('realtime-posts');
        postsChannel
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'posts' },
                async (payload) => {
                    // Get user's profile to check clan_tag for filtering
                    const { data: userProfile } = await supabase
                        .from('profiles')
                        .select('clan_tag')
                        .eq('id', user?.id)
                        .single();

                    // Check if this post should appear in the current active feed
                    const shouldShowPost = (() => {
                        if (activeFeed === 'my-clan') {
                            // Show only posts from user's clan with feed_type 'clan' or 'my-clan'
                            return userProfile?.clan_tag && 
                                   payload.new.clan_tag === userProfile.clan_tag &&
                                   ['clan', 'my-clan'].includes(payload.new.feed_type);
                        } else if (activeFeed === 'global') {
                            // Show only posts with feed_type 'global'
                            return payload.new.feed_type === 'global';
                        } else if (activeFeed === 'group') {
                            // Show posts from allied clans with feed_type 'group'
                            // Note: For real-time updates, we'll need to fetch allied clans
                            // This is a simplified check - in practice you might want to cache allied clans
                            return payload.new.feed_type === 'group' && payload.new.clan_tag;
                        }
                        return false;
                    })();

                    if (!shouldShowPost) return;

                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('in_game_name, avatar_url')
                        .eq('id', payload.new.user_id)
                        .single();

                    const newPost = {
                        ...payload.new,
                        profiles: {
                            in_game_name: profile?.in_game_name ?? 'Unknown User',
                            avatar_url: profile?.avatar_url ?? null,
                        },
                        like_count: 0,
                        user_has_liked_post: false,
                    } as Post;
                    setPosts(currentPosts => [newPost, ...currentPosts]);
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'posts' },
                (payload) => {
                    setPosts(currentPosts => currentPosts.map(p => {
                        if (p.id === payload.new.id) {
                            return { ...p, ...payload.new };
                        }
                        return p;
                    }));
                }
            )
            .on(
                'postgres_changes',
                { event: 'DELETE', schema: 'public', table: 'posts' },
                (payload) => {
                    setPosts(currentPosts => currentPosts.filter(p => p.id !== payload.old.id));
                }
            )
            .subscribe();

        const likesChannel = supabase.channel('realtime-likes');
        likesChannel.on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'likes' },
            (payload) => {
                setPosts(currentPosts => currentPosts.map(p => {
                    if (p.id === payload.new.post_id) {
                        if (payload.new.user_id === user?.id) return p;
                        return { ...p, like_count: p.like_count + 1 };
                    }
                    return p;
                }));
            }
        )
        .on(
            'postgres_changes',
            { event: 'DELETE', schema: 'public', table: 'likes' },
            (payload) => {
                setPosts(currentPosts => currentPosts.map(p => {
                    if (p.id === payload.old.post_id) {
                        if (payload.old.user_id === user?.id) return p;
                        return { ...p, like_count: p.like_count - 1 };
                    }
                    return p;
                }));
            }
        )
        .subscribe();

        const commentsChannel = supabase.channel('realtime-comments');
        commentsChannel.on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'comments' },
            (payload) => {
                setPosts(currentPosts => currentPosts.map(p => {
                    if (p.id === payload.new.post_id) {
                        if (payload.new.user_id === user?.id) return p;
                        return { ...p, comment_count: p.comment_count + 1 };
                    }
                    return p;
                }));
            }
        ).subscribe();

        return () => {
            supabase.removeChannel(postsChannel);
            supabase.removeChannel(likesChannel);
            supabase.removeChannel(commentsChannel);
        };
    }, [supabase, user?.id, activeFeed]);

    const handleEditClick = (post: Post) => {
        setEditingPostId(post.id);
        setEditedContent(post.content);
    };

    const handleCancelEdit = () => {
        setEditingPostId(null);
        setEditedContent('');
    };

    const handleUpdatePost = async (postId: string) => {
        await fetch(`/api/posts/${postId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content: editedContent }),
        });
        setEditingPostId(null);
        setEditedContent('');
    };

    const handleDeletePost = async (postId: string) => {
        const response = await fetch(`/api/posts/${postId}`, {
            method: 'DELETE',
        });
        if (response.ok) {
            setPosts(currentPosts => currentPosts.filter(p => p.id !== postId));
        }
    };

    const handleLikeToggle = async (post: Post) => {
        setPosts(currentPosts => currentPosts.map(p => {
            if (p.id === post.id) {
                return {
                    ...p,
                    like_count: p.user_has_liked_post ? p.like_count - 1 : p.like_count + 1,
                    user_has_liked_post: !p.user_has_liked_post
                };
            }
            return p;
        }));

        const method = post.user_has_liked_post ? 'DELETE' : 'POST';
        const response = await fetch(`/api/posts/${post.id}/like`, { method });

        if (!response.ok) {
            setPosts(currentPosts => currentPosts.map(p => {
                if (p.id === post.id) {
                    return {
                        ...p,
                        like_count: post.like_count,
                        user_has_liked_post: post.user_has_liked_post
                    };
                }
                return p;
            }));
        }
    };

    const handleCreatePost = (newPost: Post) => {
        setPosts(currentPosts => [newPost, ...currentPosts]);
    };

    const handleCommentPosted = (postId: string) => {
        setPosts(currentPosts => currentPosts.map(p => {
            if (p.id === postId) {
                return { ...p, comment_count: p.comment_count + 1 };
            }
            return p;
        }));
    };

    const handleFeedChange = (value: string) => {
        const feedType = value as FeedType;
        setActiveFeed(feedType);
        setPage(1);
        setPosts([]);
        setHasMorePosts(true);
        setLoading(true); // Show loading state immediately
        // fetchPosts will be called by useEffect when activeFeed changes
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Clan Feed</h1>
            
            <Tabs value={activeFeed} onValueChange={handleFeedChange} className="mb-6">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="my-clan">My Clan</TabsTrigger>
                    <TabsTrigger value="global">Global</TabsTrigger>
                    <TabsTrigger value="group">Group</TabsTrigger>
                </TabsList>
                
                <TabsContent value={activeFeed} className="mt-6">
                    <div className="mb-8">
                        <CreatePost onCreatePost={handleCreatePost} feedType={activeFeed} />
                    </div>
                    {loading ? (
                        <div className="space-y-6">
                            {[...Array(3)].map((_, i) => (
                                <Card key={i}>
                                    <CardHeader className="flex flex-row items-center gap-4">
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-1/4" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-3/4 mt-2" />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {posts.length === 0 ? (
                                <Card>
                                    <CardContent className="py-8 text-center">
                                        <p className="text-muted-foreground">
                                            {activeFeed === 'my-clan' && 'No posts in your clan feed yet. Be the first to post!'}
                                            {activeFeed === 'global' && 'No global posts yet. Switch to Global and create the first one!'}
                                            {activeFeed === 'group' && 'No group posts yet. Post something to share with your allied clans!'}
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : null}
                            {posts.map((post) => (
                                <Card key={post.id}>
                                    <CardHeader className="flex flex-row items-center gap-4">
                                        <Avatar>
                                            <AvatarImage src={post.profiles?.avatar_url || undefined} />
                                            <AvatarFallback>{post.profiles?.in_game_name?.charAt(0) || 'U'}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-grow">
                                            <p className="font-bold">{post.profiles?.in_game_name || 'Unknown User'}</p>
                                            <p className="text-xs text-muted-foreground">{new Date(post.created_at).toLocaleString()}</p>
                                        </div>
                                        {user && user.id === post.user_id && (
                                            <div className="ml-auto">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent>
                                                        <DropdownMenuItem onSelect={() => handleEditClick(post)}>Edit</DropdownMenuItem>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Delete</DropdownMenuItem>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        This action cannot be undone. This will permanently delete your post.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => handleDeletePost(post.id)}>Continue</AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        )}
                                    </CardHeader>
                                    <CardContent className="pb-4">
                                        {editingPostId === post.id ? (
                                            <div className="space-y-2">
                                                <Textarea value={editedContent} onChange={(e) => setEditedContent(e.target.value)} className="w-full" />
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" onClick={handleCancelEdit}>Cancel</Button>
                                                    <Button onClick={() => handleUpdatePost(post.id)}>Save</Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-sm whitespace-pre-wrap">{post.content}</p>
                                        )}
                                        {post.image_url && (
                                            <div className="mt-4">
                                                <img 
                                                    src={`${post.image_url}?width=500`}
                                                    alt="Post image" 
                                                    className="max-h-[500px] w-full object-contain rounded-md"
                                                />
                                            </div>
                                        )}
                                    </CardContent>
                                    <div className="px-6 pb-4">
                                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Heart className="w-4 h-4" />
                                                <span>{post.like_count}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <MessageCircle className="w-4 h-4" />
                                                <span>{post.comment_count} comments</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Separator />
                                    <CardFooter className="py-2">
                                        <div className="flex w-full justify-around">
                                            <Button variant="ghost" className="w-full" onClick={() => handleLikeToggle(post)}>
                                                <Heart className={`w-5 h-5 mr-2 ${post.user_has_liked_post ? 'text-primary fill-current' : ''}`} />
                                                Like
                                            </Button>
                                            <Button variant="ghost" className="w-full">
                                                <MessageCircle className="w-5 h-5 mr-2" />
                                                Comment
                                            </Button>
                                        </div>
                                    </CardFooter>
                                    <Separator />
                                    <CommentSection post={post} onCommentPosted={() => handleCommentPosted(post.id)} />
                                </Card>
                            ))}
                            {isFetchingMore && (
                                <div className="space-y-6">
                                    <Card>
                                        <CardHeader className="flex flex-row items-center gap-4">
                                            <Skeleton className="h-10 w-10 rounded-full" />
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-1/4" />
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <Skeleton className="h-4 w-full" />
                                            <Skeleton className="h-4 w-3/4 mt-2" />
                                        </CardContent>
                                    </Card>
                                </div>
                            )}
                            <div ref={ref} />
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default ClanFeedPage; 