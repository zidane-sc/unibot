export const appConfig = {
  databaseUrl: process.env.DATABASE_URL ?? '',
  sessionSecret: process.env.SESSION_SECRET ?? '',
  internalApiSecret: process.env.INTERNAL_API_SECRET ?? '',
  timezone: process.env.TZ ?? 'Asia/Jakarta',
  webUrl: process.env.WEB_URL ?? 'http://localhost:3000'
};

export function assertConfigured() {
  // TODO: throw descriptive errors when mandatory env vars are missing
  return appConfig;
}
