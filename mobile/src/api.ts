import Constants from 'expo-constants';
import { Platform } from 'react-native';

import type {
  AuthConfig,
  AuthResponse,
  ConfirmPaymentPayload,
  CreateOrderPayload,
  MeResponse,
  OrderListResponse,
  OrderResponse,
  PaymentResponse,
  ProductListResponse,
  ProductResponse,
} from './types';

/**
 * Resolve the API base URL, in priority order:
 *  1. EXPO_PUBLIC_API_BASE            — set this for a deployed build (see mobile/.env.example)
 *  2. dev machine LAN IP + :4000      — so a physical Android phone on the same
 *                                       Wi-Fi as Metro can reach the local backend
 *  3. http://localhost:4000           — web / iOS simulator fallback
 */
function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost;
  const lanHost = hostUri?.split(':')[0];
  if (lanHost && Platform.OS !== 'web') return `http://${lanHost}:4000`;

  return 'http://localhost:4000';
}

export const API_BASE = resolveBaseUrl();

// Session token — set by the auth store on hydrate / sign-in / sign-out.
let authToken: string | null = null;
export function setAuthToken(token: string | null) {
  authToken = token;
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      /* ignore */
    }
    const detail = (body as { error?: string })?.error ?? '';
    const err = new Error(detail || `Request failed (${res.status})`) as Error & {
      status?: number;
      body?: unknown;
    };
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return (await res.json()) as T;
}

export const api = {
  listProducts: () => http<ProductListResponse>('/api/products'),
  getProduct: (slug: string) => http<ProductResponse>(`/api/products/${encodeURIComponent(slug)}`),

  createOrder: (payload: CreateOrderPayload) =>
    http<OrderResponse>('/api/orders', { method: 'POST', body: JSON.stringify(payload) }),
  listOrders: () => http<OrderListResponse>('/api/orders'),
  getOrder: (reference: string) => http<OrderResponse>(`/api/orders/${encodeURIComponent(reference)}`),

  getPayment: (reference: string) =>
    http<PaymentResponse>(`/api/payments/${encodeURIComponent(reference)}`),
  confirmPayment: (reference: string, payload: ConfirmPaymentPayload) =>
    http<PaymentResponse>(`/api/payments/${encodeURIComponent(reference)}/confirm`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  authConfig: () => http<AuthConfig>('/api/auth/config'),
  googleAuth: (idToken: string) =>
    http<AuthResponse>('/api/auth/google', { method: 'POST', body: JSON.stringify({ idToken }) }),
  mockAuth: (body: { email: string; name?: string; picture?: string }) =>
    http<AuthResponse>('/api/auth/mock', { method: 'POST', body: JSON.stringify(body) }),
  me: () => http<MeResponse>('/api/auth/me'),
};
