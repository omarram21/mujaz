import { supabase, unwrap } from '@/services/supabase';
import type { AppLocale } from '@/lib/formatNumber';
import type { TablesUpdate } from '@/lib/database.types';
import { useAuthStore, type Profile } from './store';

export type SignUpRole = 'student' | 'teacher';

export async function signUpWithEmail(input: {
  fullName: string;
  email: string;
  password: string;
  role: SignUpRole;
  locale: AppLocale;
}) {
  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    options: { data: { full_name: input.fullName.trim(), role: input.role, locale: input.locale } },
  });
  if (error) throw error;
  return data;
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) throw error;
  return data;
}

/** Phone OTP needs an SMS provider configured in Supabase (feature-flagged in the UI). */
export async function sendPhoneOtp(phone: string, meta?: { fullName?: string; role?: SignUpRole }) {
  const { error } = await supabase.auth.signInWithOtp({
    phone,
    options: { data: meta ? { full_name: meta.fullName, role: meta.role } : undefined },
  });
  if (error) throw error;
}

export async function verifyPhoneOtp(phone: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
  if (error) throw error;
  return data;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function fetchProfile(userId: string): Promise<Profile> {
  return unwrap(await supabase.from('profiles').select('*').eq('id', userId).single());
}

export async function refreshProfile(): Promise<Profile | null> {
  const id = useAuthStore.getState().session?.user.id;
  if (!id) return null;
  const p = await fetchProfile(id);
  useAuthStore.getState().setProfile(p);
  return p;
}

export async function updateProfile(patch: TablesUpdate<'profiles'>): Promise<Profile> {
  const id = useAuthStore.getState().session?.user.id;
  if (!id) throw new Error('not signed in');
  const p = unwrap(await supabase.from('profiles').update(patch).eq('id', id).select('*').single());
  useAuthStore.getState().setProfile(p);
  return p;
}

export const authFlags = {
  phone: process.env.EXPO_PUBLIC_ENABLE_PHONE_AUTH === 'true',
  google: process.env.EXPO_PUBLIC_ENABLE_GOOGLE_AUTH === 'true',
};
