'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { Post, Profile } from '@/lib/types';
import { Image as ImageIcon, X } from 'lucide-react';

interface CreatePostProps {
    onCreatePost: (post: Post) => void;
}

const CreatePost = ({ onCreatePost }: CreatePostProps) => {
    const [content, setContent] = useState('');
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
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

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!content.trim() && !imageFile) || !user) return;

        setIsUploading(true);

        let imageUrl: string | null = null;
        if (imageFile) {
            try {
                // 1. Get signed URL
                const signedUrlResponse = await fetch('/api/posts/image-upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fileType: imageFile.type }),
                });

                if (!signedUrlResponse.ok) throw new Error('Failed to get signed URL');
                const { token, path, signedUrl } = await signedUrlResponse.json();

                // 2. Upload image to Supabase Storage
                const uploadResponse = await fetch(signedUrl, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': imageFile.type,
                    },
                    body: imageFile,
                });

                if (!uploadResponse.ok) throw new Error('Failed to upload image');

                // 3. Get public URL
                const { data } = supabase.storage.from('post-images').getPublicUrl(path);
                imageUrl = data.publicUrl;

            } catch (error) {
                console.error('Image upload failed:', error);
                // Handle error (e.g., show a toast message)
                setIsUploading(false);
                return;
            }
        }

        const response = await fetch('/api/clan-feed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content, image_url: imageUrl }),
        });

        if (response.ok) {
            const newPost = await response.json();
            onCreatePost(newPost);
            setContent('');
            handleRemoveImage();
        } else {
            console.error('Failed to create post');
            // Handle error
        }
        setIsUploading(false);
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
                    className="focus:ring-0 resize-none"
                />
                {imagePreview && (
                    <div className="relative">
                        <img src={imagePreview} alt="Preview" className="rounded-lg max-h-60" />
                        <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 rounded-full w-6 h-6 p-0"
                            onClick={handleRemoveImage}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                )}
                <div className="flex justify-between items-center">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Photo/Video
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        className="hidden"
                        accept="image/png, image/jpeg, image/gif"
                    />
                    <Button type="submit" disabled={(!content.trim() && !imageFile) || isUploading}>
                        {isUploading ? 'Posting...' : 'Post'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default CreatePost; 