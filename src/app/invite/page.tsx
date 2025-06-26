import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KeyRound } from 'lucide-react';
import { verifyInviteCode } from './actions';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

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
            ClanOS is currently invite-only. Please enter your invite code to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex-1 flex flex-col w-full justify-center gap-2 text-foreground"
            action={verifyInviteCode}
          >
            <Label htmlFor="invite-code">Invite Code</Label>
            <Input
              id="invite-code"
              name="code"
              placeholder="CLANOS-XXXX-XXXX"
              required
              className="mb-4"
            />
            <Button type="submit">Continue</Button>
            {searchParams?.message && (
              <p className="mt-4 p-4 bg-foreground/10 text-foreground text-center">
                {searchParams.message}
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </main>
  );
} 