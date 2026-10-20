import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import type { Tables } from '@/lib/database.types';

export type Profile = Tables<'profiles'>;

type Status = 'loading' | 'signedOut' | 'signedIn';

interface AuthState {
  status: Status;
  session: Session | null;
  profile: Profile | null;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  session: null,
  profile: null,
  setSession: (session) =>
    set((s) => ({
      session,
      status: session ? 'signedIn' : 'signedOut',
      profile: session && s.profile?.id === session.user.id ? s.profile : null,
    })),
  setProfile: (profile) => set({ profile }),
}));

export const useSession = () => useAuthStore((s) => s.session);
export const useProfile = () => useAuthStore((s) => s.profile);
export const useUserId = () => useAuthStore((s) => s.session?.user.id ?? null);

/** Profile that is guaranteed to exist inside signed-in route groups. */
export function useRequiredProfile(): Profile {
  const p = useAuthStore((s) => s.profile);
  if (!p) throw new Error('useRequiredProfile used outside a signed-in route');
  return p;
}
