import Constants from 'expo-constants';
import { Platform } from 'react-native';

import type {
  CreateOrderPayload,
  OrderListResponse,
  OrderResponse,
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

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    let detail = '';
    try {
      detail = ((await res.json()) as { error?: string })?.error ?? '';
    } catch {
      /* ignore */
    }
    const err = new Error(detail || `Request failed (${res.status})`) as Error & { status?: number };
    err.status = res.status;
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
};
