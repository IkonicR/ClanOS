'use client';

import React from 'react';
import { useFormState } from 'react-dom';
import { completeSignupWithEmail, verifyPlayerToken } from '@/app/signup/actions';
import Link from 'next/link';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';

const initialVerifyState = { message: '', success: false as boolean | undefined };
const initialEmailState = { message: '' };

const SignUpForm = () => {
  const [verifyState, verifyAction] = useFormState(verifyPlayerToken, initialVerifyState);
  const [emailState, emailAction] = useFormState(completeSignupWithEmail, initialEmailState);
  const supabase = createClient();
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [step, setStep] = React.useState<1 | 2>(1);
  React.useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setIsAuthenticated(!!data.session));
  }, [supabase]);
  React.useEffect(() => {
    if (verifyState.success) setStep(2);
  }, [verifyState.success]);

  return (
    <div className="container mx-auto flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Verify Your Player Account</CardTitle>
          <CardDescription className="text-center pt-2">
            Enter your Clash of Clans Player Tag and API Token to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
          <form action={verifyAction} className="space-y-6">
            <div>
              <Label htmlFor="playerTag">Player Tag</Label>
              <Input
                id="playerTag"
                name="playerTag"
                type="text"
                required
                placeholder="#2PP"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="apiToken">API Token</Label>
                <Input
                  id="apiToken"
                  name="apiToken"
                  type="text"
                  required
                  className="mt-1"
                />
              <p className="mt-2 text-sm text-muted-foreground">
                You can find this in the game under Settings &gt; More Settings &gt; API Token.
              </p>
            </div>

            <div>
              <Button type="submit" className="w-full">Verify Player</Button>
            </div>
            {verifyState?.message && <p className="text-sm text-red-500 text-center">{verifyState.message}</p>}
          </form>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {!isAuthenticated && (
                <form action={emailAction} className="space-y-6">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" autoComplete="email" required className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" autoComplete="current-password" required className="mt-1" />
                  </div>
                  <div>
                    <Button type="submit" className="w-full">Create Account</Button>
                  </div>
                  {emailState?.message && <p className="text-sm text-red-500 text-center">{emailState.message}</p>}
                </form>
              )}

              {/* OAuth path */}
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>
                <div className="mt-4">
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/auth/oauth/google?next=%2Fdashboard">Continue with Google</Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignUpForm; 