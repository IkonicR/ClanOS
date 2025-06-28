'use client';

import { LiveblocksProvider } from '@liveblocks/react/suspense';
import { ReactNode } from 'react';

export function AppLiveblocksProvider({ children }: { children: ReactNode }) {
  return <LiveblocksProvider authEndpoint="/api/liveblocks-auth">{children}</LiveblocksProvider>;
} 