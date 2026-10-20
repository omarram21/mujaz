// Creates (or reuses) a private Daily room for a booking and returns a meeting token
// for the caller. The Daily API key lives only in this function's secrets.
//
//   npx supabase secrets set DAILY_API_KEY=...
//
// POST { bookingId } with the user's Authorization header → { url, token, role, endsAt }
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, json } from '../_shared/cors.ts';

const DAILY_API = 'https://api.daily.co/v1';
const JOIN_EARLY_MIN = 10;
const GRACE_MIN = 15;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const apiKey = Deno.env.get('DAILY_API_KEY');
  if (!apiKey) return json({ error: 'daily_not_configured' }, 503);

  const authHeader = req.headers.get('Authorization') ?? '';
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });
  const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return json({ error: 'unauthorized' }, 401);
  const uid = userData.user.id;

  let bookingId: string | undefined;
  try {
    ({ bookingId } = await req.json());
  } catch {
    return json({ error: 'bad_request' }, 400);
  }
  if (!bookingId || !/^[0-9a-f-]{36}$/i.test(bookingId)) return json({ error: 'bad_request' }, 400);

  const { data: booking } = await admin
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .maybeSingle();
  if (!booking || (booking.student_id !== uid && booking.teacher_id !== uid)) {
    return json({ error: 'booking_not_found' }, 404);
  }
  if (booking.status === 'cancelled') return json({ error: 'booking_cancelled' }, 409);

  const now = Date.now();
  const start = new Date(booking.starts_at).getTime();
  const end = new Date(booking.ends_at).getTime();
  if (now < start - JOIN_EARLY_MIN * 60_000)
    return json({ error: 'too_early', startsAt: booking.starts_at }, 409);
  if (now > end + GRACE_MIN * 60_000) return json({ error: 'session_over' }, 409);

  const isTeacher = booking.teacher_id === uid;
  const { data: me } = await admin.from('profiles').select('full_name').eq('id', uid).single();
  const exp = Math.floor(end / 1000) + GRACE_MIN * 60;
  const headers = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' };

  // Room: deterministic name per booking, private, two participants, never recorded.
  const roomName = booking.daily_room_name ?? `mujaz-${booking.id}`;
  let roomUrl: string | undefined;
  const existing = await fetch(`${DAILY_API}/rooms/${roomName}`, { headers });
  if (existing.ok) {
    roomUrl = (await existing.json()).url;
  } else {
    const created = await fetch(`${DAILY_API}/rooms`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: roomName,
        privacy: 'private',
        properties: {
          exp,
          nbf: Math.floor(start / 1000) - JOIN_EARLY_MIN * 60,
          max_participants: 2,
          eject_at_room_exp: true,
          enable_chat: false,
          enable_screenshare: false,
          enable_prejoin_ui: false,
          start_video_off: false,
          start_audio_off: false,
        },
      }),
    });
    if (!created.ok) return json({ error: 'daily_room_failed', detail: await created.text() }, 502);
    roomUrl = (await created.json()).url;
  }
  if (!booking.daily_room_name) {
    await admin.from('bookings').update({ daily_room_name: roomName }).eq('id', booking.id);
  }

  const tokenRes = await fetch(`${DAILY_API}/meeting-tokens`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      properties: {
        room_name: roomName,
        user_id: uid,
        user_name: me?.full_name ?? '',
        is_owner: isTeacher,
        exp,
        eject_at_token_exp: true,
      },
    }),
  });
  if (!tokenRes.ok) return json({ error: 'daily_token_failed' }, 502);
  const { token } = await tokenRes.json();

  return json({
    url: roomUrl,
    token,
    role: isTeacher ? 'teacher' : 'student',
    endsAt: booking.ends_at,
  });
});
