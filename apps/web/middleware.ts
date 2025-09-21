import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { unsealData } from 'iron-session/edge';

import { sessionOptions, type SessionData } from './lib/session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const session = await readSession(request);

  if (pathname.startsWith('/admin/login')) {
    if (session.userId) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/admin';
      redirectUrl.search = '';
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next();
  }

  if (!session.userId) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/admin/login';
    loginUrl.search = '';
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

async function readSession(request: NextRequest): Promise<SessionData> {
  const sealed = request.cookies.get(sessionOptions.cookieName)?.value;

  if (!sealed) {
    return {};
  }

  try {
    const data = await unsealData<SessionData>(sealed, {
      password: sessionOptions.password
    });

    return data ?? {};
  } catch {
    return {};
  }
}

export const config = {
  matcher: ['/admin/:path*']
};
