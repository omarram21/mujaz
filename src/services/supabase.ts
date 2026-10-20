import 'react-native-url-polyfill/auto';
import { AppState, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * SecureStore values are capped at ~2KB, and Supabase sessions can be larger,
 * so the session is split into chunks.
 */
const CHUNK = 1800;
const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    const count = await SecureStore.getItemAsync(`${key}.n`);
    if (count === null) return null;
    const parts: string[] = [];
    for (let i = 0; i < Number(count); i++) {
      const part = await SecureStore.getItemAsync(`${key}.${i}`);
      if (part === null) return null;
      parts.push(part);
    }
    return parts.join('');
  },
  async setItem(key: string, value: string): Promise<void> {
    await secureStorage.removeItem(key);
    const n = Math.ceil(value.length / CHUNK);
    for (let i = 0; i < n; i++) {
      await SecureStore.setItemAsync(`${key}.${i}`, value.slice(i * CHUNK, (i + 1) * CHUNK));
    }
    await SecureStore.setItemAsync(`${key}.n`, String(n));
  },
  async removeItem(key: string): Promise<void> {
    const count = await SecureStore.getItemAsync(`${key}.n`);
    if (count !== null) {
      for (let i = 0; i < Number(count); i++) await SecureStore.deleteItemAsync(`${key}.${i}`);
      await SecureStore.deleteItemAsync(`${key}.n`);
    }
  },
};

export const supabase = createClient<Database>(
  url || 'http://localhost:54421',
  anonKey || 'missing-anon-key',
  {
    auth: {
      storage: Platform.OS === 'web' ? undefined : secureStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === 'web',
    },
  },
);

// Refresh tokens only while the app is in the foreground (Supabase RN recommendation).
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') void supabase.auth.startAutoRefresh();
    else void supabase.auth.stopAutoRefresh();
  });
}

type PgResult = { data: unknown; error: { message: string; code?: string } | null };

/** Throws the PostgREST error (and on a missing row) so TanStack Query surfaces it. */
export function unwrap<R extends PgResult>(res: R): NonNullable<R['data']> {
  if (res.error) throw Object.assign(new Error(res.error.message), { code: res.error.code });
  if (res.data === null || res.data === undefined) {
    throw Object.assign(new Error('not found'), { code: 'PGRST116' });
  }
  return res.data as NonNullable<R['data']>;
}

/** Like unwrap, but a missing row (maybeSingle) is a valid null. */
export function unwrapMaybe<R extends PgResult>(res: R): NonNullable<R['data']> | null {
  if (res.error) throw Object.assign(new Error(res.error.message), { code: res.error.code });
  return (res.data ?? null) as NonNullable<R['data']> | null;
}
