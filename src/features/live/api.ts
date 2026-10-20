import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { create } from 'zustand';
import { supabase, unwrap, unwrapMaybe } from '@/services/supabase';
import type { Tables } from '@/lib/database.types';

export type Mistake = Tables<'recitation_mistakes'>;
export type MistakeType = Mistake['type'];
export const MISTAKE_TYPES: MistakeType[] = ['tajweed', 'hifz', 'harakah', 'waqf'];

export interface CallCredentials {
  url: string;
  token: string;
  role: 'teacher' | 'student';
  endsAt: string;
}

/** Asks the Edge Function for a room + token. Error codes come back as `error`. */
export async function fetchCallCredentials(bookingId: string): Promise<CallCredentials> {
  const { data, error } = await supabase.functions.invoke<CallCredentials>('create-daily-room', {
    body: { bookingId },
  });
  if (error) {
    let code = 'call_failed';
    if (error instanceof FunctionsHttpError) {
      try {
        code = ((await error.context.json()) as { error?: string }).error ?? code;
      } catch {
        // keep generic code
      }
    }
    throw Object.assign(new Error(code), { code });
  }
  if (!data) throw Object.assign(new Error('call_failed'), { code: 'call_failed' });
  return data;
}

/** Mistakes of a booking, kept live with Supabase Realtime. */
export function useLiveMistakes(bookingId: string) {
  const qc = useQueryClient();
  const key = ['mistakes', bookingId];
  const query = useQuery({
    queryKey: key,
    queryFn: async () =>
      unwrap(
        await supabase
          .from('recitation_mistakes')
          .select('*')
          .eq('booking_id', bookingId)
          .order('created_at'),
      ),
  });
  useEffect(() => {
    const channel = supabase
      .channel(`mistakes:${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'recitation_mistakes',
          filter: `booking_id=eq.${bookingId}`,
        },
        () => void qc.invalidateQueries({ queryKey: ['mistakes', bookingId] }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [bookingId, qc]);
  return query;
}

export function useAddMistake(booking: { id: string; teacher_id: string; student_id: string }) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (m: {
      type: MistakeType;
      surah?: number;
      ayah?: number;
      page?: number;
      description: string;
    }) =>
      unwrap(
        await supabase
          .from('recitation_mistakes')
          .insert({
            booking_id: booking.id,
            teacher_id: booking.teacher_id,
            student_id: booking.student_id,
            type: m.type,
            surah: m.surah ?? null,
            ayah: m.ayah ?? null,
            page: m.page ?? null,
            description: m.description.trim(),
          })
          .select('*')
          .single(),
      ),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['mistakes', booking.id] }),
  });
}

export function useDeleteMistake(bookingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      unwrapMaybe(await supabase.from('recitation_mistakes').delete().eq('id', id));
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['mistakes', bookingId] }),
  });
}

/** Reading position shared during a call (teacher → student via app messages). */
export interface ReadingPosition {
  fromPage: number;
  toPage: number;
}

interface LiveStore {
  positions: Record<string, ReadingPosition>;
  setPosition: (bookingId: string, p: ReadingPosition) => void;
}

/** Keeps the last position per booking so the session record can be prefilled after the call. */
export const useLiveStore = create<LiveStore>((set) => ({
  positions: {},
  setPosition: (bookingId, p) => set((s) => ({ positions: { ...s.positions, [bookingId]: p } })),
}));

export function isPositionMessage(d: unknown): d is { type: 'position' } & ReadingPosition {
  if (!d || typeof d !== 'object') return false;
  const m = d as Record<string, unknown>;
  return m.type === 'position' && typeof m.fromPage === 'number' && typeof m.toPage === 'number';
}
