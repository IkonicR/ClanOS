'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { Post, Profile } from '@/lib/types';
import { Image as ImageIcon, X } from 'lucide-react';

interface CreatePostProps {
    onCreatePost: (post: Post) => void;
    feedType?: string;
}

const CreatePost = ({ onCreatePost, feedType = 'clan' }: CreatePostProps) => {
    const [content, setContent] = useState('');
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isImageUploading, setIsImageUploading] = useState(false);
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

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsImageUploading(true);
            setImageFile(file);
            
            // Create preview after a short delay to show loading state
            setTimeout(() => {
                setImagePreview(URL.createObjectURL(file));
                setIsImageUploading(false);
            }, 300);
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
        setIsImageUploading(false);
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
            body: JSON.stringify({ content, image_url: imageUrl, feed_type: feedType }),
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
                {(imagePreview || isImageUploading) && (
                    <div className="relative border-2 border-dashed border-gray-200 rounded-lg p-4">
                        {isImageUploading ? (
                            <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                                    <p className="text-sm text-muted-foreground">Loading image...</p>
                                </div>
                            </div>
                        ) : imagePreview ? (
                            <>
                                <Image src={imagePreview} alt="Preview" width={400} height={240} className="rounded-lg max-h-60 w-full object-contain" />
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="absolute top-6 right-6 rounded-full w-8 h-8 p-0 shadow-lg"
                                    onClick={handleRemoveImage}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </>
                        ) : null}
                    </div>
                )}
                <div className="flex justify-between items-center">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isImageUploading || isUploading}
                    >
                        <ImageIcon className="w-4 h-4 mr-2" />
                        {isImageUploading ? 'Loading...' : 'Photo/Video'}
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        className="hidden"
                        accept="image/png, image/jpeg, image/gif"
                    />
                    <Button type="submit" disabled={(!content.trim() && !imageFile) || isUploading || isImageUploading}>
                        {isUploading ? 'Posting...' : 'Post'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default CreatePost; 