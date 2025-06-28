'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Profile } from '@/lib/types';
import { Loader2 } from 'lucide-react';

type EditProfileDialogProps = {
    profile: Profile;
    onUpdate: (updatedData: Partial<Profile>) => Promise<void>;
    children: React.ReactNode;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

type FormData = {
    bio: string;
    twitter: string;
    instagram: string;
    website: string;
};

export const EditProfileDialog = ({ profile, onUpdate, children, open, onOpenChange }: EditProfileDialogProps) => {
    const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormData>({
        defaultValues: {
            bio: profile.bio || '',
            twitter: profile.social_links?.twitter || '',
            instagram: profile.social_links?.instagram || '',
            website: profile.social_links?.website || '',
        },
    });

    const onSubmit = async (data: FormData) => {
        const updatedData: Partial<Profile> = {
            bio: data.bio,
            social_links: {
                twitter: data.twitter,
                instagram: data.instagram,
                website: data.website,
            },
        };
        await onUpdate(updatedData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                        <DialogDescription>
                            Make changes to your profile here. Click save when you&apos;re done.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="bio">Bio</Label>
                            <Textarea id="bio" {...register('bio')} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="twitter">Twitter Handle</Label>
                            <Input id="twitter" {...register('twitter')} placeholder="@username" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="instagram">Instagram Handle</Label>
                            <Input id="instagram" {...register('instagram')} placeholder="@username" />
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="website">Website URL</Label>
                            <Input id="website" {...register('website')} placeholder="https://example.com" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}; 