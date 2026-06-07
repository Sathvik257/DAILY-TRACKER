import type { StoredData } from '../types';
import { APP_STORAGE_PREFIX } from '../constants/brand';

const TOKEN_KEY = `${APP_STORAGE_PREFIX}-token`;

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

export interface User {
  id: string;
  email: string;
  name: string;
}

export class ApiError extends Error {
  status: number;
  __isApiError = true;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError || (typeof err === 'object' && err !== null && '__isApiError' in err);
}

export function setUnauthorizedHandler(handler: UnauthorizedHandler): void {
  onUnauthorized = handler;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function parseResponse(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    if (res.status === 404) {
      throw new ApiError(
        'API not found. Redeploy with database configured (see README).',
        404
      );
    }
    throw new ApiError('Server returned an invalid response', res.status);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`/api${path}`, { ...options, headers });
  } catch {
    throw new ApiError('Cannot reach server. Check your internet connection.', 0);
  }

  const body = await parseResponse(res);
  const errorMsg = typeof body.error === 'string' ? body.error : 'Something went wrong';

  if (res.status === 401) {
    clearToken();
    onUnauthorized?.();
    throw new ApiError(errorMsg, 401);
  }

  if (!res.ok) {
    throw new ApiError(errorMsg, res.status);
  }

  return body as T;
}

export async function register(email: string, password: string, name: string) {
  return request<{ token: string; user: User }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });
}

export async function login(email: string, password: string) {
  return request<{ token: string; user: User }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function fetchMe() {
  return request<{ user: User }>('/me');
}

export async function fetchData(): Promise<StoredData> {
  return request<StoredData>('/data');
}

export async function saveData(data: StoredData): Promise<void> {
  await request('/data', { method: 'PUT', body: JSON.stringify(data) });
}

export async function resetServerData(): Promise<void> {
  await request('/data', { method: 'DELETE' });
}
