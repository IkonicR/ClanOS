import { Header } from '@/components/header';
import React from 'react';
import { Home, Package2, Users, LineChart, Settings, BotMessageSquare } from 'lucide-react'
import FriendRequestsDropdown from '@/components/friend-requests-dropdown'
import { Link } from 'react-router-dom';
import { Sheet, SheetContent } from '@/components/ui/sheet'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
} 