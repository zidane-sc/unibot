import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(_req: NextRequest) {
  // TODO: enforce session-based authentication
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/internal/:path*']
};
