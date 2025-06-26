'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { KeyRound, Copy, PlusCircle } from 'lucide-react';

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
    // This should be an API route to protect this logic, but for now we'll do it client-side
    // for simplicity. In a real app, you'd call your own API endpoint here.
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    // Simple random code generation
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();

    const { error } = await supabase
      .from('invite_codes')
      .insert([{ code, created_by: user.id }]);

    if (error) {
      toast({ title: 'Error', description: 'Failed to generate invite code.', variant: 'destructive' });
    } else {
      toast({ title: 'Success!', description: `Generated new invite code: ${code}` });
      fetchInviteCodes(); // Refresh the list
    }
    setIsGenerating(false);
  };
  
  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: 'Copied!', description: 'Invite code copied to clipboard.' });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Invite Codes</CardTitle>
          <CardDescription>Generate and manage invite codes for new users.</CardDescription>
        </div>
        <Button onClick={generateInviteCode} disabled={isGenerating}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {isGenerating ? 'Generating...' : 'Generate New Code'}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading invite codes...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Used By</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inviteCodes.map((invite) => (
                <TableRow key={invite.id}>
                  <TableCell className="font-mono">{invite.code}</TableCell>
                  <TableCell>{new Date(invite.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{invite.is_active && !invite.used_by ? 'Active' : 'Used'}</TableCell>
                  <TableCell>{invite.used_by ?? 'N/A'}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(invite.code)}>
                      <Copy className="h-4 w-4" />
                    </Button>
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