const baseUrl = process.env.WORKER_URL ?? 'http://localhost:4000';
const internalSecret = process.env.INTERNAL_API_SECRET ?? '';

export type WorkerRequest = {
  path: string;
  body?: unknown;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
};

export async function callWorkerApi<T = unknown>({ path, body, method = 'POST' }: WorkerRequest): Promise<T> {
  if (!internalSecret) {
    throw new Error('INTERNAL_API_SECRET belum dikonfigurasi.');
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      'x-internal-secret': internalSecret
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(
      `Worker API gagal (${method} ${path}): ${response.status} ${response.statusText} ${message}`.trim()
    );
  }

  const data = (await response.json().catch(() => null)) as T | null;
  return (data as T) ?? (undefined as T);
}
