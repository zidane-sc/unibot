import { NextResponse } from 'next/server';

import { getSession } from '../../../lib/session';

export async function GET() {
  const session = await getSession();

  if (!session.userId) {
    return NextResponse.json({ authenticated: false });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: session.userId,
      phoneNumber: session.phoneNumber
    }
  });
}
