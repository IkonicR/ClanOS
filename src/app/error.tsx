'use client'

import * as React from 'react'
import * as Sentry from '@sentry/nextjs'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  React.useEffect(() => {
    try { Sentry.captureException(error) } catch {}
    // eslint-disable-next-line no-console
    console.error('App error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="text-muted-foreground max-w-md">An unexpected error occurred while rendering the app. Try again or go back to the dashboard.</p>
      <div className="flex gap-3">
        <Button onClick={() => reset()} variant="default">Try again</Button>
        <Button asChild variant="outline">
          <Link href="/">Go home</Link>
        </Button>
      </div>
      {error?.digest && <p className="text-xs text-muted-foreground">Error ID: {error.digest}</p>}
    </div>
  )
}
