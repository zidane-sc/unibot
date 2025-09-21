export type ApiRequest = {
  path: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
};

const DEFAULT_HEADERS = {
  'content-type': 'application/json',
  accept: 'application/json'
};

export async function callWebInternalApi({ path, method = 'POST', body }: ApiRequest) {
  const baseUrl = process.env.WEB_INTERNAL_URL ?? 'http://localhost:3000';
  const secret = process.env.INTERNAL_API_SECRET;

  if (!secret) {
    throw new Error('INTERNAL_API_SECRET is not configured');
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...DEFAULT_HEADERS,
      'x-internal-secret': secret
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(
      `Internal API request failed (${method} ${path}): ${response.status} ${response.statusText} ${message}`.trim()
    );
  }

  return response;
}
