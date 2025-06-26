'use client';

import { useState, useEffect, useCallback } from 'react';
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
  used_by_username: string | null;
  used_at: string | null;
  is_active: boolean;
  expires_at: string;
}

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
      .insert([{ 
        code, 
        created_by: user.id,
        expires_at: expiresAt.toISOString() 
      }]);

    if (error) {
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
              <p className="text-muted-foreground mt-2 mb-6">Click &quot;Generate New Code&quot; to create your first invite.</p>
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
                <TableHead>Expires At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inviteCodes.map((invite) => (
                <TableRow key={invite.id} className="hover:bg-secondary/50">
                  <TableCell className="font-mono">{invite.code}</TableCell>
                  <TableCell>
                    {invite.used_by_username ? (
                        <Badge variant="secondary">Used</Badge>
                    ) : new Date(invite.expires_at) < new Date() ? (
                        <Badge variant="destructive">Expired</Badge>
                    ) : invite.is_active ? (
                        <Badge variant="default" className="bg-green-600/90 text-white">Active</Badge>
                    ) : (
                        <Badge variant="destructive">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>{invite.used_by_username ?? <span className="text-muted-foreground/60">N/A</span>}</TableCell>
                  <TableCell>{new Date(invite.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(invite.expires_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right space-x-2 flex items-center justify-end">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Switch
                            checked={invite.is_active}
                            onCheckedChange={() => handleToggleActive(invite)}
                            disabled={!!invite.used_by || new Date(invite.expires_at) < new Date()}
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