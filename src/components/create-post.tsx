'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { Post, Profile } from '@/lib/types';

interface CreatePostProps {
    onCreatePost: (post: Post) => void;
}

const CreatePost = ({ onCreatePost }: CreatePostProps) => {
    const [content, setContent] = useState('');
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const supabase = createClient();

    useEffect(() => {
        const fetchUserAndProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                setProfile(profileData);
            }
        };
        fetchUserAndProfile();
    }, [supabase]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || !user) return;

        const response = await fetch('/api/clan-feed', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content }),
        });

        if (response.ok) {
            const newPost: Post = await response.json();
            onCreatePost(newPost);
            setContent('');
        } else {
            console.error('Failed to create post');
        }
    };

    return (
        <div className="flex items-start gap-4 p-4 border rounded-lg">
            <Avatar>
                <AvatarImage src={profile?.avatar_url ?? undefined} />
                <AvatarFallback>{profile?.username?.charAt(0) ?? 'U'}</AvatarFallback>
            </Avatar>
            <form onSubmit={handleSubmit} className="w-full space-y-2">
                <Textarea
                    placeholder="What's on your mind?"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={3}
                    className="bg-transparent border-none focus:ring-0"
                />
                <div className="flex justify-end">
                    <Button type="submit" disabled={!content.trim() || !user}>Post</Button>
                </div>
            </form>
        </div>
    );
};

export default CreatePost; 