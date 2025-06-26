import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KeyRound, ShieldAlert } from 'lucide-react';
import { verifyInviteCode } from './actions';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default async function InvitePage({
  searchParams,
}: {
  searchParams: { message: string };
}) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    redirect('/dashboard');
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-primary/10 p-3">
                    <KeyRound className="h-8 w-8 text-primary" />
                </div>
            </div>
          <CardTitle className="text-2xl">You&apos;re Invited</CardTitle>
          <CardDescription>
            ClanOS is currently invite-only. Please enter your code to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {searchParams?.message && (
            <Alert variant="destructive" className="mb-4">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Validation Failed</AlertTitle>
              <AlertDescription>
                {searchParams.message}
              </AlertDescription>
            </Alert>
          )}
          <form
            className="flex-1 flex flex-col w-full justify-center gap-4"
            action={verifyInviteCode}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="invite-code">Invite Code</Label>
              <Input
                id="invite-code"
                name="code"
                placeholder="CLANOS-XXXX-XXXX"
                required
                className="text-center tracking-widest font-mono"
              />
            </div>
            <Button type="submit" className="w-full">Verify & Continue</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
} 