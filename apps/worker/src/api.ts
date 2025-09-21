export type ApiRequest = {
  path: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
};

export async function callWebInternalApi({ path, method = 'POST', body }: ApiRequest) {
  // TODO: include INTERNAL_API_SECRET header and handle non-2xx responses
  const baseUrl = process.env.WEB_INTERNAL_URL ?? 'http://localhost:3000';
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'content-type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });

  return response;
}
