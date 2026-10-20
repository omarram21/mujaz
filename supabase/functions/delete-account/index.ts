// Permanently deletes the caller's account (required by Apple and Google).
// Removes their uploaded certificates from Storage, then deletes the auth user;
// the database cascades the rest. Issued ijazahs remain verifiable by code.
//
// POST (Authorization: Bearer <user JWT>) → { deleted: true }
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, json } from '../_shared/cors.ts';

const BUCKET = 'teacher-documents';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const { data, error } = await userClient.auth.getUser();
  if (error || !data.user) return json({ error: 'unauthorized' }, 401);
  const uid = data.user.id;

  const { data: profile } = await admin.from('profiles').select('role').eq('id', uid).maybeSingle();
  if (profile?.role === 'admin') return json({ error: 'admin_accounts_are_managed_manually' }, 403);

  // Storage: <uid>/<applicationId>/<file>
  const { data: folders } = await admin.storage.from(BUCKET).list(uid, { limit: 1000 });
  for (const folder of folders ?? []) {
    const prefix = `${uid}/${folder.name}`;
    const { data: files } = await admin.storage.from(BUCKET).list(prefix, { limit: 1000 });
    const paths = (files ?? []).map((f) => `${prefix}/${f.name}`);
    if (paths.length) await admin.storage.from(BUCKET).remove(paths);
  }

  const { error: delError } = await admin.auth.admin.deleteUser(uid);
  if (delError) return json({ error: 'delete_failed', detail: delError.message }, 500);
  return json({ deleted: true });
});
