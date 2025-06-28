'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { KeyRound, Copy, PlusCircle, Users, BarChart3, CheckCircle2, XCircle, PauseCircle, PlayCircle, Trash2, Calendar, User, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cn } from '@/lib/utils';

const ResponsiveAlertDialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse gap-2 mt-4 sm:mt-0 sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
);

interface InviteCode {
  id: string;
  code: string;
  created_at: string;
  used_by: string | null;
  used_by_username: string | null;
  used_at: string | null;
  expires_at: string;
}

function StatCard({ title, value, icon: Icon }: { title: string; value: string | number; icon: React.ElementType }) {
  return (
    <Card className="bg-secondary/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

const InviteCodeCard = ({ invite, onCopy, onDelete }: { invite: InviteCode, onCopy: (code: string) => void, onDelete: (id: string) => void }) => {
    const getStatus = () => {
        if (invite.used_by) return { text: 'Used', variant: 'secondary', icon: Users };
        if (new Date(invite.expires_at) < new Date()) return { text: 'Expired', variant: 'destructive', icon: XCircle };
        return { text: 'Active', variant: 'default', className: 'bg-green-600/90 text-white', icon: CheckCircle2 };
    };

    const status = getStatus();
    
    return (
        <Card className="hover:bg-secondary/50 transition-colors">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="font-mono text-lg">{invite.code}</CardTitle>
                        <div className="mt-1">
                            <Badge variant={status.variant as any} className={status.className}>
                                <status.icon className="w-3 h-3 mr-1.5" />
                                {status.text}
                            </Badge>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => onCopy(invite.code)}>
                            <Copy className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently delete the invite code <span className="font-mono font-bold">{invite.code}</span>. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <ResponsiveAlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => onDelete(invite.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                </ResponsiveAlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
                 <div className="flex items-center">
                    <User className="w-4 h-4 mr-3"/>
                    <span>Used by: <span className="font-medium text-foreground">{invite.used_by_username ?? 'N/A'}</span></span>
                </div>
                 <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-3"/>
                    <span>Expires: <span className="font-medium text-foreground">{new Date(invite.expires_at).toLocaleDateString()}</span></span>
                </div>
            </CardContent>
        </Card>
    );
};

export default function AdminInvitesPage() {
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const supabase = createClient();
  const { toast } = useToast();

  const fetchInviteCodes = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('invite_codes')
      .select('*, profiles:used_by(username)')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error fetching codes', description: error.message, variant: 'destructive' });
      setInviteCodes([]);
    } else {
      const formattedData = data.map((item: any) => ({
        ...item,
        used_by_username: item.profiles?.username,
      }));
      setInviteCodes(formattedData);
    }
    setIsLoading(false);
  }, [supabase, toast]);

  useEffect(() => {
    fetchInviteCodes();
  }, [fetchInviteCodes]);

  const stats = useMemo(() => {
    const total = inviteCodes.length;
    const used = inviteCodes.filter(code => code.used_by).length;
    const active = inviteCodes.filter(code => !code.used_by && new Date(code.expires_at) > new Date()).length;
    const expired = inviteCodes.filter(code => new Date(code.expires_at) <= new Date() && !code.used_by).length;
    return { total, used, active, expired };
  }, [inviteCodes]);
  
  const generateInviteCode = async () => {
    setIsGenerating(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in to generate codes.', variant: 'destructive' });
      setIsGenerating(false);
      return;
    }
    
    const code = `CLANOS-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Codes expire in 7 days

    const { error } = await supabase
      .from('invite_codes')
      .insert({ 
        code, 
        created_by: user.id,
        expires_at: expiresAt.toISOString(),
      });

    if (error) {
      console.error("Failed to generate code. Full error:", JSON.stringify(error, null, 2));
      toast({ title: 'Error', description: `Failed to generate invite code: ${error.message}`, variant: 'destructive' });
    } else {
      toast({ title: 'Success!', description: `Generated new invite code: ${code}` });
      await fetchInviteCodes(); // Refresh the list
    }
    setIsGenerating(false);
  };
  
  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: 'Copied!', description: 'Invite code copied to clipboard.' });
  }

  const handleDeleteCode = async (inviteId: string) => {
    // Optimistic UI update
    const originalCodes = [...inviteCodes];
    const updatedCodes = inviteCodes.filter(code => code.id !== inviteId);
    setInviteCodes(updatedCodes);

    const { error, count } = await supabase
      .from('invite_codes')
      .delete({ count: 'exact' })
      .eq('id', inviteId);

    if (error) {
      console.error("Failed to delete code. Full error:", JSON.stringify(error, null, 2));
      toast({ title: 'Error', description: `Failed to delete code: ${error.message}`, variant: 'destructive' });
      setInviteCodes(originalCodes); // Revert on error
    } else if (count === 0) {
      console.error("No code was deleted. The code might not exist or RLS is preventing deletion.");
      toast({ title: 'Deletion Failed', description: `No code was deleted. It may have already been removed.`, variant: 'destructive' });
      setInviteCodes(originalCodes); // Revert on error
    } else {
      toast({ title: 'Success!', description: `Invite code has been deleted.` });
    }
  }

  return (
    <div className="flex flex-col gap-6">
       <Card className="border-border/60">
        <CardHeader>
            <CardTitle className="flex items-center">
              <KeyRound className="w-6 h-6 mr-3 text-primary"/>
              Invite Code Management
            </CardTitle>
            <CardDescription className="pt-2">Generate and manage one-time use invite codes for new users.</CardDescription>
        </CardHeader>
       </Card>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Generated" value={stats.total} icon={BarChart3} />
            <StatCard title="Active Codes" value={stats.active} icon={CheckCircle2} />
            <StatCard title="Used Codes" value={stats.used} icon={Users} />
            <StatCard title="Expired Codes" value={stats.expired} icon={XCircle} />
        </div>
        <Card className="border-border/60">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <CardTitle>Generated Codes</CardTitle>
                    <CardDescription>
                        Here are all the invite codes that have been generated.
                    </CardDescription>
                </div>
                <Button onClick={generateInviteCode} disabled={isGenerating} className="w-full sm:w-auto">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    <span className="sm:inline">{isGenerating ? 'Generating...' : 'Generate New Code'}</span>
                </Button>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                <div className="flex justify-center items-center h-48">
                    <p>Loading invite codes...</p>
                </div>
                ) : inviteCodes.length === 0 ? (
                <div className="text-center py-16 px-6 border-2 border-dashed border-border/50 rounded-lg">
                    <div className="flex justify-center mb-4">
                        <div className="p-4 bg-secondary rounded-full">
                            <Users className="w-8 h-8 text-secondary-foreground" />
                        </div>
                    </div>
                    <h3 className="text-xl font-semibold">No Invite Codes Yet</h3>
                    <p className="text-muted-foreground mt-2 mb-6">Click &quot;Generate New Code&quot; to create your first invite.</p>
                    <Button onClick={generateInviteCode} disabled={isGenerating}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        {isGenerating ? 'Generating...' : 'Generate First Code'}
                    </Button>
                </div>
                ) : (
                <div>
                    {/* Mobile View */}
                    <div className="md:hidden space-y-4">
                        {inviteCodes.map((invite) => (
                            <InviteCodeCard key={invite.id} invite={invite} onCopy={copyToClipboard} onDelete={handleDeleteCode} />
                        ))}
                    </div>

                    {/* Desktop View */}
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Used By</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead>Expires</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {inviteCodes.map((invite) => (
                                <TableRow key={invite.id} className="hover:bg-secondary/50">
                                <TableCell className="font-mono">{invite.code}</TableCell>
                                <TableCell>
                                    {invite.used_by ? (
                                        <Badge variant="secondary" className="flex items-center w-fit"><Users className="w-3 h-3 mr-1.5"/>Used</Badge>
                                    ) : new Date(invite.expires_at) < new Date() ? (
                                        <Badge variant="destructive" className="flex items-center w-fit"><XCircle className="w-3 h-3 mr-1.5"/>Expired</Badge>
                                    ) : (
                                        <Badge variant="default" className="bg-green-600/90 text-white flex items-center w-fit"><CheckCircle2 className="w-3 h-3 mr-1.5"/>Active</Badge>
                                    )}
                                </TableCell>
                                <TableCell>{invite.used_by_username ?? <span className="text-muted-foreground/60">N/A</span>}</TableCell>
                                <TableCell>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger>{new Date(invite.created_at).toLocaleDateString()}</TooltipTrigger>
                                            <TooltipContent>
                                                <p>{new Date(invite.created_at).toLocaleString()}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </TableCell>
                                <TableCell>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger>{new Date(invite.expires_at).toLocaleDateString()}</TooltipTrigger>
                                            <TooltipContent>
                                                <p>{new Date(invite.expires_at).toLocaleString()}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </TableCell>
                                <TableCell className="text-right">
                                <div className="flex items-center justify-end">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger>
                                            <Button variant="ghost" size="icon" onClick={() => copyToClipboard(invite.code)}>
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Copy Code</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    <AlertDialog>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Delete Code</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will permanently delete the invite code <span className="font-mono font-bold">{invite.code}</span>. This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <ResponsiveAlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteCode(invite.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                            </ResponsiveAlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                                </TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
} 