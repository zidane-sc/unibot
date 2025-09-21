import type { IronSession, IronSessionOptions } from 'iron-session';

export type SessionData = {
  userId?: string;
  phoneNumber?: string;
};

export type UnibotSession = IronSession<SessionData>;

export const sessionOptions: IronSessionOptions = {
  password: process.env.SESSION_SECRET ?? 'change-me',
  cookieName: 'unibot_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production'
  }
};

export async function getSession(): Promise<UnibotSession> {
  // TODO: integrate iron-session with Next.js request/response helpers
  return {} as UnibotSession;
}
