const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

const USER_ID_STORAGE_KEY = 'vtt_user_id';

function getOrCreateUserId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const existing = window.localStorage.getItem(USER_ID_STORAGE_KEY);
    if (existing) return existing;
    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
    window.localStorage.setItem(USER_ID_STORAGE_KEY, id);
    return id;
  } catch {
    return undefined;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const userId = getOrCreateUserId();

  const headers: Record<string, string> = {
    ...(userId ? { 'x-user-id': userId } : {}),
    ...(options?.headers as Record<string, string> | undefined),
  };

  // Only send JSON content-type when there is a body.
  if (options?.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }

  // Some endpoints (e.g. DELETE) return 204 No Content. In that case, skip JSON parsing.
  if (res.status === 204 || res.status === 205) {
    return undefined as T;
  }

  // If there is no body, also skip JSON parsing.
  const text = await res.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) =>
    request<T>(path, { method: 'DELETE' }),
};
