'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { KeyRound, Copy, PlusCircle, Users, ToggleRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface InviteCode {
  id: string;
  code: string;
  created_at: string;
  used_by: string | null;
  used_at: string | null;
  is_active: boolean;
}

export default function AdminInvitesPage() {
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const supabase = createClient();
  const { toast } = useToast();

  const fetchInviteCodes = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('invite_codes')
      .select(`
        id,
        code,
        created_at,
        is_active,
        used_at,
        used_by_profile:profiles(username)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: 'Failed to fetch invite codes.', variant: 'destructive' });
      setInviteCodes([]);
    } else {
      // The type from Supabase is slightly different, so we map it
      const formattedData = data.map((item: any) => ({
        ...item,
        used_by: item.used_by_profile?.username,
      }));
      setInviteCodes(formattedData);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchInviteCodes();
  }, []);

  const generateInviteCode = async () => {
    setIsGenerating(true);
    // In a real app, you might want this on an API route secured for admins only
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in to generate codes.', variant: 'destructive' });
      setIsGenerating(false);
      return;
    }
    
    // Generate a more readable random code
    const code = `CLANOS-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const { error } = await supabase
      .from('invite_codes')
      .insert([{ code, created_by: user.id }]);

    if (error) {
      toast({ title: 'Error', description: 'Failed to generate invite code. Please try again.', variant: 'destructive' });
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

  const handleToggleActive = async (invite: InviteCode) => {
    const { error } = await supabase
      .from('invite_codes')
      .update({ is_active: !invite.is_active })
      .eq('id', invite.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update code status.', variant: 'destructive' });
    } else {
      toast({ title: 'Success!', description: `Code ${invite.code} has been ${!invite.is_active ? 'activated' : 'deactivated'}.` });
      fetchInviteCodes(); // Refresh list
    }
  }

  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center">
            <KeyRound className="w-6 h-6 mr-3 text-primary"/>
            Invite Codes
          </CardTitle>
          <CardDescription className="pt-2">Generate and manage one-time use invite codes for new users.</CardDescription>
        </div>
        <Button onClick={generateInviteCode} disabled={isGenerating}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {isGenerating ? 'Generating...' : 'Generate New Code'}
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
              <p className="text-muted-foreground mt-2 mb-6">Click "Generate New Code" to create your first invite.</p>
              <Button onClick={generateInviteCode} disabled={isGenerating}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {isGenerating ? 'Generating...' : 'Generate Code'}
              </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Used By</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inviteCodes.map((invite) => (
                <TableRow key={invite.id} className="hover:bg-secondary/50">
                  <TableCell className="font-mono">{invite.code}</TableCell>
                  <TableCell>
                    {invite.used_by ? (
                        <Badge variant="secondary">Used</Badge>
                    ) : invite.is_active ? (
                        <Badge variant="default" className="bg-green-600/90 text-white">Active</Badge>
                    ) : (
                        <Badge variant="destructive">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>{invite.used_by ?? <span className="text-muted-foreground/60">N/A</span>}</TableCell>
                  <TableCell>{new Date(invite.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right space-x-2 flex items-center justify-end">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Switch
                            checked={invite.is_active}
                            onCheckedChange={() => handleToggleActive(invite)}
                            disabled={!!invite.used_by}
                            aria-label="Toggle code active"
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{invite.is_active ? 'Deactivate' : 'Activate'} Code</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                         <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => copyToClipboard(invite.code)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Copy Code</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
} 