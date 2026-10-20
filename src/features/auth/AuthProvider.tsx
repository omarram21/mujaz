import { useEffect, type ReactNode } from 'react';
import { supabase } from '@/services/supabase';
import { fetchProfile } from './api';
import { useAuthStore } from './store';

/** Keeps the Zustand auth store in sync with Supabase auth and loads the profile. */
export function AuthProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const { setSession, setProfile } = useAuthStore.getState();
    let active = true;

    const load = async (userId: string | undefined) => {
      if (!userId) return setProfile(null);
      try {
        const p = await fetchProfile(userId);
        if (active) setProfile(p);
      } catch {
        // Profile row is created by a DB trigger; a transient failure leaves it null
        // and the root layout shows the error state with retry.
        if (active) setProfile(null);
      }
    };

    void supabase.auth.getSession().then(async ({ data }) => {
      await load(data.session?.user.id);
      if (active) setSession(data.session);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') return;
      // Avoid awaiting Supabase calls inside the callback (can deadlock the auth lock).
      setTimeout(() => {
        void load(session?.user.id).then(() => active && setSession(session));
      }, 0);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return <>{children}</>;
}
