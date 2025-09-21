export type WorkerRequest = {
  path: string;
  body?: unknown;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
};

export async function callWorkerApi({ path, body, method = 'POST' }: WorkerRequest) {
  // TODO: sign request with INTERNAL_API_SECRET and handle errors
  const baseUrl = process.env.WORKER_URL ?? 'http://localhost:4000';
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'content-type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });

  return response;
}
