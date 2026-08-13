const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export interface ApiErrorBody {
  error?: { code: string; message: string };
}

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const body = (await res.json().catch(() => ({}))) as ApiErrorBody & T;

  if (!res.ok) {
    const err = (body as ApiErrorBody).error;
    throw new ApiError(res.status, err?.message ?? "Request failed", err?.code);
  }

  return body as T;
}
