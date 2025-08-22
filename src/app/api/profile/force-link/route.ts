import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Temporarily disabled due to database schema issues
  return NextResponse.json({ message: 'Force link temporarily disabled' });
}