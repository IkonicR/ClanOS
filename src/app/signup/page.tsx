'use client';

import React from 'react';
import { useFormState } from 'react-dom';
import { verifyPlayerAccount } from '@/app/signup/actions';
import Link from 'next/link';

const initialState = {
  message: '',
};

const SignUpPage = () => {
  const [state, formAction] = useFormState(verifyPlayerAccount, initialState);

  return (
    <div className="container mx-auto flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6">Verify Your Player Account</h1>
        <p className="text-center text-muted-foreground mb-8">
          Enter your Clash of Clans Player Tag and the API Token from the game to get started.
        </p>
        <form action={formAction} className="space-y-6">
          <div>
            <label htmlFor="playerTag" className="block text-sm font-medium text-muted-foreground">
              Player Tag
            </label>
            <div className="mt-1">
              <input
                id="playerTag"
                name="playerTag"
                type="text"
                required
                placeholder="#2PP"
                className="block w-full px-3 py-2 border bg-input text-foreground border-border rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="apiToken" className="block text-sm font-medium text-muted-foreground">
              API Token
            </label>
            <div className="mt-1">
              <input
                id="apiToken"
                name="apiToken"
                type="text"
                required
                className="block w-full px-3 py-2 border bg-input text-foreground border-border rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              You can find your API token in the game under Settings &gt; More Settings &gt; API Token.
            </p>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-muted-foreground">
              Email
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="block w-full px-3 py-2 border bg-input text-foreground border-border rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-muted-foreground">
              Password
            </label>
            <div className="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="block w-full px-3 py-2 border bg-input text-foreground border-border rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Verify and Sign Up
            </button>
          </div>
          {state?.message && <p className="text-sm text-red-500 text-center">{state.message}</p>}
        </form>
         <p className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUpPage; 