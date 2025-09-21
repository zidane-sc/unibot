import type { IronSessionOptions } from 'iron-session';
import { cookies } from 'next/headers';
import { unsealData } from 'iron-session/edge';

const DEV_FALLBACK_SECRET = 'dev-only-session-secret-change-me-please-123456';

function resolveSessionSecret(): string {
  const envSecret = process.env.SESSION_SECRET;

  if (envSecret && envSecret.length >= 32) {
    return envSecret;
  }

  if (envSecret && envSecret.length < 32) {
    console.warn('SESSION_SECRET must be at least 32 characters long.');
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET must be set and contain at least 32 characters.');
  }

  return DEV_FALLBACK_SECRET;
}

export type SessionData = {
  userId?: string;
  phoneNumber?: string;
};

export const sessionOptions: IronSessionOptions = {
   password: resolveSessionSecret(),
  cookieName: 'unibot_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production'
  }
};

export async function getSession(): Promise<SessionData> {
  const cookieStore = cookies();
  const sealed = cookieStore.get(sessionOptions.cookieName)?.value;

  if (!sealed) {
    return {};
  }

  try {
    const data = await unsealData<SessionData>(sealed, {
      password: sessionOptions.password
    });

    return data ?? {};
  } catch (error) {
    console.warn('Failed to unseal session cookie', error);
    return {};
  }
}
