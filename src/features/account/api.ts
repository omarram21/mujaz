import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';
import { queryClient } from '@/lib/queryClient';

/** Calls the delete-account Edge Function, then clears the local session and cache. */
export async function deleteMyAccount(): Promise<void> {
  const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
  if (error) {
    let code = 'delete_failed';
    if (error instanceof FunctionsHttpError) {
      try {
        code = ((await error.context.json()) as { error?: string }).error ?? code;
      } catch {
        // keep generic
      }
    }
    throw Object.assign(new Error(code), { code });
  }
  queryClient.clear();
  await supabase.auth.signOut({ scope: 'local' });
}
