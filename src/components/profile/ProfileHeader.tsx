'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Profile } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Camera, Mail, Twitter, Instagram, Link as LinkIcon, Edit, Trash2 } from 'lucide-react';
import { EditProfileDialog } from './EditProfileDialog';
import { useToast } from '@/components/ui/use-toast';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';

type ProfileHeaderProps = {
    profile: Profile | null;
    playerData: any; // Define this type properly
    isOwner: boolean;
    onProfileUpdate: (updatedProfile: Profile) => void;
};

const ProfileHeader = ({ profile, playerData, isOwner, onProfileUpdate }: ProfileHeaderProps) => {
    const { toast } = useToast();
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    
    // Banner state
    const bannerInputRef = useRef<HTMLInputElement>(null);
    const bannerImgRef = useRef<HTMLImageElement>(null);
    const [bannerSrc, setBannerSrc] = useState<string | null>(null);
    const [bannerCrop, setBannerCrop] = useState<Crop>();
    const [completedBannerCrop, setCompletedBannerCrop] = useState<Crop | null>(null);
    const [isBannerCropDialogOpen, setIsBannerCropDialogOpen] = useState(false);
    const [isUploadingBanner, setIsUploadingBanner] = useState(false);
    const [isBannerLoading, setIsBannerLoading] = useState(false);
    
    if (!profile) return null; // Or render a skeleton/default state

    const handleUpdate = async (updatedData: Partial<Profile>) => {
        const response = await fetch('/api/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData),
        });

        if (response.ok) {
            const newProfile = await response.json();
            onProfileUpdate(newProfile);
            toast({
                title: 'Profile Updated',
                description: 'Your changes have been saved successfully.',
            });
            setIsEditDialogOpen(false);
        } else {
            toast({
                title: 'Error',
                description: 'Failed to update profile.',
                variant: 'destructive',
            });
        }
    };

    const handleBannerFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setIsBannerLoading(true);
            setBannerCrop(undefined); // Reset crop state
            setCompletedBannerCrop(null);
            setIsBannerCropDialogOpen(true);
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setBannerSrc(reader.result as string);
                setIsBannerLoading(false);
            });
            reader.readAsDataURL(e.target.files[0]);
            if(bannerInputRef.current) {
                bannerInputRef.current.value = '';
            }
        }
    };

    const onBannerImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget;
        const crop = centerCrop(
            makeAspectCrop(
                {
                    unit: 'px',
                    width: width,
                },
                16 / 5, // A wider aspect ratio for banners
                width,
                height
            ),
            width,
            height
        );
        setBannerCrop(crop);
        setCompletedBannerCrop(crop);
    };
    
    const handleSaveBanner = () => {
        if (!bannerImgRef.current || !completedBannerCrop) {
            return;
        }
        const image = bannerImgRef.current;
        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        
        canvas.width = Math.floor(completedBannerCrop.width * scaleX);
        canvas.height = Math.floor(completedBannerCrop.height * scaleY);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not process the image.' });
            return;
        }

        const cropX = completedBannerCrop.x * scaleX;
        const cropY = completedBannerCrop.y * scaleY;

        ctx.drawImage(
            image,
            cropX,
            cropY,
            canvas.width,
            canvas.height,
            0,
            0,
            canvas.width,
            canvas.height
        );

        canvas.toBlob(async (blob) => {
            if (!blob) {
                toast({ variant: 'destructive', title: 'Error', description: 'Could not create image file.' });
                return;
            }

            // Optimistic UI: Create a local URL for instant preview
            const localUrl = URL.createObjectURL(blob);
            const originalUrl = profile.banner_url;
            onProfileUpdate({ ...profile, banner_url: localUrl });

            // Close the dialog and reset state
            setIsBannerCropDialogOpen(false);
            setBannerSrc(null);

            toast({ title: 'Uploading Banner', description: 'Your new banner is being updated.' });

            const formData = new FormData();
            formData.append('banner', blob, 'banner.jpeg');

            try {
                const response = await fetch('/api/profile/banner-upload', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error('Failed to upload banner');
                }

                const { banner_url } = await response.json();
                
                // Final state update with the real URL. Add timestamp to bust cache.
                const finalUrl = `${banner_url}?t=${new Date().getTime()}`;
                onProfileUpdate({ ...profile, banner_url: finalUrl });
                URL.revokeObjectURL(localUrl); // Clean up the local URL

                toast({
                    title: 'Success!',
                    description: 'Your banner has been updated.',
                });

            } catch (error) {
                console.error('Failed to upload banner:', error);
                toast({
                    variant: 'destructive',
                    title: 'Upload Failed',
                    description: 'Could not update your banner. Please try again.',
                });
                // Revert the optimistic update on failure
                onProfileUpdate({ ...profile, banner_url: originalUrl });
                URL.revokeObjectURL(localUrl);
            } finally {
                setIsUploadingBanner(false);
            }
        }, 'image/jpeg');
    };

    const handleRemoveBanner = async () => {
        try {
            const response = await fetch('/api/profile/banner-upload', { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to remove banner');
            onProfileUpdate({ ...profile, banner_url: null });
            toast({ title: 'Success', description: 'Banner removed successfully.' });
        } catch (error) {
            console.error(error);
            toast({ title: 'Error', description: 'Failed to remove banner.', variant: 'destructive' });
        }
    };

    const socialLinks = profile?.social_links as { [key: string]: string } | null;

    return (
        <>
            <input
                type="file"
                ref={bannerInputRef}
                onChange={handleBannerFileSelect}
                className="hidden"
                accept="image/png, image/jpeg, image/gif"
            />
            <Dialog open={isBannerCropDialogOpen} onOpenChange={setIsBannerCropDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Crop your new banner</DialogTitle>
                        <p className="text-sm text-muted-foreground pt-2">
                            Adjust the selection to crop your banner. The result will have a 16:5 aspect ratio.
                        </p>
                    </DialogHeader>
                    <div className="flex-grow overflow-hidden flex justify-center items-center my-4">
                        {isBannerLoading ? (
                            <div className="w-full h-64 flex items-center justify-center bg-muted/50 rounded-md">
                                <p>Loading Preview...</p>
                            </div>
                        ) : (
                            bannerSrc && (
                                <ReactCrop
                                    crop={bannerCrop}
                                    onChange={c => setBannerCrop(c)}
                                    onComplete={c => setCompletedBannerCrop(c)}
                                    aspect={16 / 5}
                                    className="max-h-full"
                                >
                                    <Image
                                        ref={bannerImgRef}
                                        src={bannerSrc}
                                        alt="Banner to crop"
                                        onLoad={onBannerImageLoad}
                                        className="max-h-[60vh] object-contain"
                                        width={800}
                                        height={250}
                                        unoptimized
                                    />
                                </ReactCrop>
                            )
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsBannerCropDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveBanner} disabled={isBannerLoading || isUploadingBanner || !completedBannerCrop}>
                            {isBannerLoading ? 'Loading Preview...' : isUploadingBanner ? 'Uploading...' : 'Save Banner'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="rounded-lg overflow-hidden">
                {/* Banner Image */}
                <div className="h-48 md:h-[450px] bg-card relative group">
                    {profile?.banner_url ? (
                        <Image
                            key={profile.banner_url} // Force re-render on URL change
                            src={profile.banner_url}
                            alt="Profile Banner"
                            fill
                            className="object-cover transition-opacity duration-300"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-r from-gray-800 to-gray-900" />
                    )}
                    {isOwner && (
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-2">
                            <Button variant="outline" size="sm" onClick={() => bannerInputRef.current?.click()}>
                                <Camera className="w-4 h-4 mr-2" />
                                Change Banner
                            </Button>
                            {profile?.banner_url && (
                                <Button variant="destructive" size="sm" onClick={handleRemoveBanner}>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Remove Banner
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                {/* Profile Info */}
                <div className="bg-background p-4">
                    <div className="flex flex-col md:flex-row">
                        {/* Avatar */}
                        <div className="flex-shrink-0 -mt-20 mx-auto md:mx-0">
                            <Avatar className="h-32 w-32 border-4 border-background ring-2 ring-primary">
                                <AvatarImage src={profile?.avatar_url ?? undefined} />
                                <AvatarFallback className="text-4xl">
                                    {playerData.name.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                        </div>

                        {/* Name, Bio, Socials */}
                        <div className="mt-4 md:mt-0 md:ml-6 flex-grow">
                            <div className="flex flex-col md:flex-row justify-between items-start">
                                <div>
                                    <h1 className="text-3xl font-bold">{playerData.name}</h1>
                                    <p className="text-sm text-muted-foreground">@{profile?.username || playerData.tag}</p>
                                </div>
                                <div className="flex items-center space-x-2 mt-4 md:mt-0">
                                    {isOwner && (
                                        <EditProfileDialog 
                                            profile={profile} 
                                            onUpdate={handleUpdate}
                                            open={isEditDialogOpen}
                                            onOpenChange={setIsEditDialogOpen}
                                        >
                                            <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(true)}>
                                                <Edit className="w-4 h-4 mr-2" />
                                                Edit Profile
                                            </Button>
                                        </EditProfileDialog>
                                    )}
                                </div>
                            </div>
                            <p className="mt-2 text-muted-foreground max-w-prose">
                                {profile?.bio || 'No bio yet.'}
                            </p>
                            <div className="flex items-center space-x-4 mt-4">
                                {socialLinks?.email && <a href={`mailto:${socialLinks.email}`}><Mail className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" /></a>}
                                {socialLinks?.twitter && <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer"><Twitter className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" /></a>}
                                {socialLinks?.instagram && <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer"><Instagram className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" /></a>}
                                {socialLinks?.website && <a href={socialLinks.website} target="_blank" rel="noopener noreferrer"><LinkIcon className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" /></a>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ProfileHeader; 