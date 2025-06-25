'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader, User, Palette, Key, LogOut, Shield, Trophy, Gamepad2, Paintbrush, Twitter, Youtube, Bell, Sun, Moon, Laptop } from 'lucide-react';
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

// Main Settings Page Layout
const SettingsPage = () => {
    const [activeTab, setActiveTab] = useState('profile');
    const { profile, loading, error } = useProfile();

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
                return <ProfileSettings initialProfile={profile} />;
            case 'appearance':
                return <AppearanceSettings />;
            case 'notifications':
                return <NotificationSettings />;
            case 'account':
                return <AccountSettings />;
            default:
                return null;
        }
    };

    return (
        <div className="container mx-auto py-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <nav className="flex flex-col space-y-2">
                    <SettingsTab
                        id="profile"
                        icon={<User className="w-5 h-5" />}
                        label="Profile"
                        activeTab={activeTab}
                        onClick={setActiveTab}
                    />
                    <SettingsTab
                        id="appearance"
                        icon={<Paintbrush className="w-5 h-5" />}
                        label="Appearance"
                        activeTab={activeTab}
                        onClick={setActiveTab}
                    />
                    <SettingsTab
                        id="notifications"
                        icon={<Bell className="w-5 h-5" />}
                        label="Notifications"
                        activeTab={activeTab}
                        onClick={setActiveTab}
                    />
                    <SettingsTab
                        id="account"
                        icon={<Key className="w-5 h-5" />}
                        label="Account & Security"
                        activeTab={activeTab}
                        onClick={setActiveTab}
                    />
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


// DATA FETCHING HOOK
interface ProfileData {
    location: string;
    languages: string[];
    player_tag: string;
    username: string;
    bio: string;
    avatar_url: string;
    birthday?: string;
    social_links?: {
        discord?: string;
        twitter?: string;
        youtube?: string;
    }
}

const useProfile = () => {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProfile = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/profile');
            if (!res.ok) throw new Error('Failed to fetch profile');
            setProfile(await res.json());
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    return { profile, loading, error, setProfile, refreshProfile: fetchProfile };
};


// PROFILE SETTINGS COMPONENT
const ProfileSettings = ({ initialProfile }: { initialProfile: ProfileData }) => {
    const [profile, setProfile] = useState(initialProfile);
    const { register, handleSubmit, control, formState: { isSubmitting }, setValue } = useForm<ProfileData>({
        defaultValues: initialProfile,
    });
    const [isSuccess, setIsSuccess] = useState(false);
    
    const onSubmit = async (formData: ProfileData) => {
        setIsSuccess(false);
        try {
            const res = await fetch('/api/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (!res.ok) throw new Error('Failed to update profile');
            setProfile(await res.json());
            setIsSuccess(true);
            setTimeout(() => setIsSuccess(false), 3000);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="space-y-8">
            <GameProfile profile={profile} />
        <form onSubmit={handleSubmit(onSubmit)}>
            <Card>
                <CardHeader>
                    <CardTitle>Public Profile</CardTitle>
                        <CardDescription>Customize your public-facing profile.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                        {/* Form Fields */}
                        <InputField id="username" label="Username" register={register("username")} placeholder="e.g. John Doe" />
                        <InputField type="date" id="birthday" label="Birthday" register={register("birthday")} />
                        <TextareaField id="bio" label="Bio" register={register("bio")} placeholder="Tell us about yourself" />
                        <InputField id="location" label="Location" register={register("location")} placeholder="e.g. San Francisco, CA" />
                        {/* Social Links */}
                        <InputField id="social_links.discord" label="Discord" icon={<p className="text-muted-foreground text-sm">#</p>} register={register("social_links.discord")} placeholder="your-discord-tag" />
                        <InputField id="social_links.twitter" label="Twitter / X" icon={<p className="text-muted-foreground text-sm">@</p>} register={register("social_links.twitter")} placeholder="your-handle" />
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

const GameProfile = ({ profile }: { profile: ProfileData }) => {
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
            {/* Placeholder for future notification settings */}
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

    useEffect(() => {
        const primaryCssValue = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
        if (primaryCssValue) {
            const hexColor = hslToHex(`hsl(${primaryCssValue})`);
            setColor(hexColor);
        }
    }, []);

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
                <div className="space-y-2">
                    <Label>Accent Color</Label>
                    <div className="flex items-center gap-4">
                        <div className='flex-grow'>
                            <HexColorPicker color={color} onChange={handleColorChange} />
                        </div>
                        <div className="w-24 h-24 rounded-lg border-4" style={{ backgroundColor: color, borderColor: color }} />
                    </div>
                    <div className="relative mt-4">
                        <span className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'>#</span>
                        <Input
                            value={color.substring(1)}
                            onChange={(e) => handleColorChange(`#${e.target.value}`)}
                            className="pl-7 font-mono"
                            maxLength={6}
                        />
                    </div>
                    <div className="flex gap-2 pt-2">
                        {PRESET_COLORS.map(preset => (
                            <button
                                key={preset}
                                onClick={() => handleColorChange(preset)}
                                className={cn("w-8 h-8 rounded-full border-2 transition-transform duration-150", color === preset ? 'border-ring scale-110' : 'border-transparent')}
                                style={{ backgroundColor: preset }}
                            />
                        ))}
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                 <Button className="ml-auto" onClick={() => {
                     // TODO: Persist theme settings to the backend
                     console.log("Saving theme settings...");
                 }}>Save Preferences</Button>
            </CardFooter>
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

// Color conversion utilities
const hexToHsl = (hex: string): string => {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) { // #rgb
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) { // #rrggbb
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

const hslToHex = (hsl: string): string => {
    // This regex handles HSL strings with spaces or commas, e.g., "hsl(94, 77%, 67%)" or "hsl(94 77% 67%)"
    const hslMatch = hsl.match(/hsl\((\d+)[,\s]*(\d+)%[,\s]*(\d+)%\)/);
    if (!hslMatch) {
        console.error("Invalid HSL string provided to hslToHex:", hsl);
        return '#000000'; // Fallback color
    }
    let h = parseInt(hslMatch[1]);
    let s = parseInt(hslMatch[2]) / 100;
    let l = parseInt(hslMatch[3]) / 100;

    let c = (1 - Math.abs(2 * l - 1)) * s;
    let x = c * (1 - Math.abs((h / 60) % 2 - 1));
    let m = l - c / 2;
    let r = 0, g = 0, b = 0;

    if (0 <= h && h < 60) { [r, g, b] = [c, x, 0]; }
    else if (60 <= h && h < 120) { [r, g, b] = [x, c, 0]; }
    else if (120 <= h && h < 180) { [r, g, b] = [0, c, x]; }
    else if (180 <= h && h < 240) { [r, g, b] = [0, x, c]; }
    else if (240 <= h && h < 300) { [r, g, b] = [x, 0, c]; }
    else if (300 <= h && h < 360) { [r, g, b] = [c, 0, x]; }

    const toHex = (c: number) => Math.round((c + m) * 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
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

const InputField = ({ id, label, register, placeholder, icon, type = "text" }: any) => (
    <div>
        <Label htmlFor={id}>{label}</Label>
        <div className="relative">
            {icon && <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">{icon}</div>}
            <Input id={id} type={type} {...register} placeholder={placeholder} className={cn(icon ? "pl-8" : "")} />
            </div>
        </div>
    );

const TextareaField = ({ id, label, register, placeholder }: any) => (
     <div>
        <Label htmlFor={id}>{label}</Label>
        <Textarea id={id} {...register} placeholder={placeholder} />
    </div>
)

export default SettingsPage; 