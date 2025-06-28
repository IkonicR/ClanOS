import { WarRoomClient } from './war-room-client';
import { AppLiveblocksProvider } from '@/components/LiveblocksProvider';

export default function WarRoomPage() {
  return (
    <AppLiveblocksProvider>
      <WarRoomClient />
    </AppLiveblocksProvider>
  );
} 