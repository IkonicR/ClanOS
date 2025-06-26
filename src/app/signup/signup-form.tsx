'use client';

import React from 'react';
import { useFormState } from 'react-dom';
import { verifyPlayerAccount } from '@/app/signup/actions';
import Link from 'next/link';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const initialState = {
  message: '',
};

const SignUpForm = () => {
  const [state, formAction] = useFormState(verifyPlayerAccount, initialState);

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
          <form action={formAction} className="space-y-6">
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Button type="submit" className="w-full">
                Verify and Sign Up
              </Button>
            </div>
            {state?.message && <p className="text-sm text-red-500 text-center">{state.message}</p>}
          </form>
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