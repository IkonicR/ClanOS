'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader, User, Palette, Key, LogOut, Shield, Trophy, Gamepad2, Paintbrush, Twitter, Youtube, Bell, Sun, Moon, Laptop, MessageSquare } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import Select from "react-tailwindcss-select";
import type { Option } from "react-tailwindcss-select/dist/components/type";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import { HexColorPicker } from 'react-colorful';
import { useDebouncedCallback } from 'use-debounce';
import languages from '@/lib/languages.json';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import AdminInvitesPage from '../admin/invites/page';
import { FeedbackSettings } from '@/components/feedback-settings';
import { LinkClanCard } from '@/components/link-clan-card';
import { useProfile } from '@/lib/hooks/useProfile';

// Main Settings Page Layout
const SettingsPage = () => {
    const [activeTab, setActiveTab] = useState('profile');
    const { profile, loading, error, refreshProfile } = useProfile();

    useEffect(() => {
        const hash = window.location.hash;
        if (hash === '#submit-idea') {
            setActiveTab('feedback');
        }
    }, []);

    const renderContent = () => {
        if (loading) {
            return <div className="flex items-center justify-center h-full"><Loader className="animate-spin text-primary" /></div>;
        }
        if (error) {
            return <div className="text-destructive">Error: {error}</div>;
        }
        if (!profile) {
            return <div className="text-muted-foreground">Could not load profile.</div>;
        }
        
        switch (activeTab) {
            case 'profile':
                return <ProfileSettings initialProfile={profile} onUpdate={refreshProfile} />;
            case 'appearance':
                return <AppearanceSettings />;
            case 'notifications':
                return <NotificationSettings />;
            case 'account':
                return <AccountSettings />;
            case 'feedback':
                return <FeedbackSettings email={profile.email} />;
            case 'admin':
                return <AdminInvitesPage />;
            default:
                return null;
        }
    };

    return (
        <div className="container mx-auto py-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <nav className="flex flex-col space-y-2">
                    <SettingsTab id="profile" icon={<User className="w-5 h-5" />} label="Profile" activeTab={activeTab} onClick={setActiveTab} />
                    <SettingsTab id="appearance" icon={<Paintbrush className="w-5 h-5" />} label="Appearance" activeTab={activeTab} onClick={setActiveTab} />
                    <SettingsTab id="notifications" icon={<Bell className="w-5 h-5" />} label="Notifications" activeTab={activeTab} onClick={setActiveTab} />
                    <SettingsTab id="account" icon={<Key className="w-5 h-5" />} label="Account & Security" activeTab={activeTab} onClick={setActiveTab} />
                    <SettingsTab id="feedback" icon={<MessageSquare className="w-5 h-5" />} label="Feedback" activeTab={activeTab} onClick={setActiveTab} />
                    {profile?.role === 'admin' && (
                        <SettingsTab id="admin" icon={<Shield className="w-5 h-5" />} label="Admin" activeTab={activeTab} onClick={setActiveTab} />
                    )}
                </nav>
                <div className="md:col-span-3">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

// Reusable Tab Component
const SettingsTab = ({ id, icon, label, activeTab, onClick }: { id: string, icon: React.ReactNode, label: string, activeTab: string, onClick: (id: string) => void }) => (
    <Button
        variant="ghost"
        onClick={() => onClick(id)}
        className={cn(
            "justify-start transition-all duration-200",
            activeTab === id ? 'bg-secondary text-secondary-foreground' : 'hover:bg-secondary/50'
        )}
    >
        {icon}
        <span className="ml-3">{label}</span>
    </Button>
);

// PROFILE SETTINGS COMPONENT
const ProfileSettings = ({ initialProfile, onUpdate }: { initialProfile: any, onUpdate: () => void }) => {
    const { register, handleSubmit, control, formState: { isSubmitting } } = useForm({
        defaultValues: initialProfile,
    });
    
    const onSubmit = async (formData: any) => {
        try {
            const res = await fetch('/api/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (!res.ok) throw new Error('Failed to update profile');
            onUpdate(); // Refresh profile data
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="space-y-8">
            <GameProfile profile={initialProfile} />
            <form onSubmit={handleSubmit(onSubmit)}>
                <Card>
                    <CardHeader>
                        <CardTitle>Public Profile</CardTitle>
                        <CardDescription>Customize your public-facing profile.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <InputField id="username" label="Username" {...register("username")} placeholder="e.g. John Doe" />
                        <InputField type="date" id="birthday" label="Birthday" {...register("birthday")} />
                        <TextareaField id="bio" label="Bio" {...register("bio")} placeholder="Tell us about yourself" />
                        <InputField id="location" label="Location" {...register("location")} placeholder="e.g. San Francisco, CA" />
                    </CardContent>
                    <CardFooter>
                    <Button type="submit" disabled={isSubmitting} className="ml-auto">
                            {isSubmitting ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Save Changes
                    </Button>
                </CardFooter>
                </Card>
            </form>
        </div>
    );
};

// GAME PROFILE COMPONENT
const usePlayerInfo = (playerTag: string | null) => {
    const [playerData, setPlayerData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!playerTag) return;
        const fetchPlayerData = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/players/${encodeURIComponent(playerTag)}`);
                if(res.ok) setPlayerData(await res.json());
            } catch (error) { console.error("Failed to fetch player data", error); } 
            finally { setLoading(false); }
        };
        fetchPlayerData();
    }, [playerTag]);

    return { playerData, loading };
}

const GameProfile = ({ profile }: { profile: any }) => {
    const { playerData, loading } = usePlayerInfo(profile?.player_tag);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><Gamepad2 className="w-5 h-5 mr-2" /> In-Game Profile</CardTitle>
                <CardDescription>Your Clash of Clans info, synced automatically.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading && <div className="flex items-center justify-center p-8"><Loader className="animate-spin text-primary" /></div>}
                {playerData ? (
                    <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                             <Avatar className="h-16 w-16">
                                <AvatarImage src={playerData.league?.iconUrls?.medium} />
                                <AvatarFallback><Trophy/></AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="text-xl font-bold">{playerData.name}</p>
                                <p className="text-sm text-muted-foreground">{profile.player_tag}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm pt-4">
                            {playerData.townHallLevel && (
                                <>
                                    <InfoRow icon={<Image src={`/town-hall-icons/Town_Hall_${playerData.townHallLevel}.png`} alt="Town Hall" width={24} height={24} />} label="Town Hall" value={playerData.townHallLevel} />
                                    <InfoRow icon={<Trophy className="w-5 h-5"/>} label="Trophies" value={playerData.trophies} />
                                </>
                            )}
                             <InfoRow icon={<Shield className="w-5 h-5"/>} label="Role" value={playerData.role ? (playerData.role.charAt(0).toUpperCase() + playerData.role.slice(1)) : 'N/A'} />
                        </div>
                     </div>
                ) : !loading && <p className="text-muted-foreground">Could not load player data.</p>}
            </CardContent>
        </Card>
    );
};

const InfoRow = ({icon, label, value}: {icon: React.ReactNode, label: string, value: string | number}) => (
    <>
        <div className="flex items-center space-x-2 text-muted-foreground">
            {icon}
            <span>{label}</span>
        </div>
        <div className="text-right font-semibold">{value || 'N/A'}</div>
    </>
)


// NOTIFICATION SETTINGS COMPONENT
const NotificationSettings = () => (
    <Card>
        <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Manage how you receive notifications from the app.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <p className="text-muted-foreground">Advanced notification settings coming soon!</p>
        </CardContent>
        <CardFooter>
            <Button className="ml-auto" disabled>Save Preferences</Button>
        </CardFooter>
    </Card>
);

// APPEARANCE SETTINGS COMPONENT
const AppearanceSettings = () => {
    const { theme, setTheme } = useTheme();
    const [color, setColor] = useState('#afea6f'); 

    const debouncedSetThemeColor = useDebouncedCallback((newColor: string) => {
        const hslString = hexToHsl(newColor).replace('hsl(', '').replace(')', '');
        document.documentElement.style.setProperty('--primary', hslString);
    }, 200);

    const handleColorChange = (newColor: string) => {
        setColor(newColor);
        debouncedSetThemeColor(newColor);
    };

    const PRESET_COLORS = ['#afea6f', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316'];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize the look and feel of the app.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="space-y-2">
                    <Label>Theme</Label>
                    <div className="grid grid-cols-3 gap-2">
                        <ThemeButton currentTheme={theme} setTheme={setTheme} value="light" label="Light" icon={<Sun className="w-5 h-5" />} />
                        <ThemeButton currentTheme={theme} setTheme={setTheme} value="dark" label="Dark" icon={<Moon className="w-5 h-5" />} />
                        <ThemeButton currentTheme={theme} setTheme={setTheme} value="system" label="System" icon={<Laptop className="w-5 h-5" />} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

const ThemeButton = ({ currentTheme, setTheme, value, label, icon }: { currentTheme?: string, setTheme: (theme: string) => void, value: string, label: string, icon: React.ReactNode }) => (
    <Button
        variant={currentTheme === value ? 'default' : 'outline'}
        onClick={() => setTheme(value)}
        className="flex flex-col h-20"
    >
        {icon}
        <span className="mt-1 text-xs">{label}</span>
    </Button>
);

const hexToHsl = (hex: string): string => {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
        r = parseInt(hex.substring(1, 3), 16);
        g = parseInt(hex.substring(3, 5), 16);
        b = parseInt(hex.substring(5, 7), 16);
    }
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
};

// ACCOUNT SETTINGS COMPONENT
const AccountSettings = () => (
    <Card>
        <CardHeader>
            <CardTitle>Account & Security</CardTitle>
            <CardDescription>Manage your account settings and security.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div>
                <Label>Change Password</Label>
                <Button disabled>Change Password</Button>
            </div>
        </CardContent>
        <CardFooter className="flex-col items-start space-y-4">
             <div className="w-full p-4 border-l-4 border-destructive bg-destructive/10">
                 <h4 className="font-bold text-destructive-foreground">Danger Zone</h4>
                 <p className="text-sm text-destructive-foreground/80 mt-1">
                     Deleting your account is a permanent action and cannot be undone.
                 </p>
                 <Button variant="destructive" className="mt-4" disabled>Delete Account</Button>
             </div>
        </CardFooter>
    </Card>
);

// FORM HELPER COMPONENTS
const Label = ({ children, htmlFor }: { children: React.ReactNode, htmlFor?: string }) => (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-muted-foreground mb-2">
        {children}
    </label>
);

const InputField = React.forwardRef<HTMLInputElement, any>(({ id, label, icon, ...props }, ref) => (
    <div>
        <Label htmlFor={id}>{label}</Label>
        <div className="relative">
            {icon && <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">{icon}</div>}
            <Input id={id} ref={ref} {...props} className={cn(icon ? "pl-8" : "")} />
        </div>
    </div>
));
InputField.displayName = 'InputField';

const TextareaField = React.forwardRef<HTMLTextAreaElement, any>(({ id, label, ...props }, ref) => (
     <div>
        <Label htmlFor={id}>{label}</Label>
        <Textarea id={id} ref={ref} {...props} />
    </div>
));
TextareaField.displayName = 'TextareaField';

export default SettingsPage; 