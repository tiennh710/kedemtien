export async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

export function apiError(payload: unknown, fallback: string) {
  if (payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string') return payload.error;
  return fallback;
}
