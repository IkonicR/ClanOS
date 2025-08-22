'use client'

import * as Sentry from '@sentry/nextjs'

export function SentryTestButton() {
  return (
    <button
      onClick={() => {
        try {
          throw new Error('Sentry test error')
        } catch (e) {
          Sentry.captureException(e)
        }
      }}
      className="px-3 py-2 text-sm rounded bg-destructive text-white"
    >
      Trigger Sentry Error
    </button>
  )
}
