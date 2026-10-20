import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, unwrap, unwrapMaybe } from '@/services/supabase';
import type { Tables } from '@/lib/database.types';
import { useAuthStore } from '@/features/auth/store';

export type Ijazah = Tables<'ijazahs'>;
export type VerifiedIjazah = {
  verification_code: string;
  student_name: string;
  teacher_name: string;
  riwayah: string;
  riwayah_name_ar: string;
  riwayah_name_en: string;
  sanad_snapshot: string;
  granting_sheikh_snapshot: string | null;
  pages_count: number;
  sessions_count: number;
  started_at: string | null;
  issued_at: string;
  revoked: boolean;
  revoke_reason: string | null;
  student_gender: 'male' | 'female' | null;
  teacher_gender: 'male' | 'female' | null;
};

export function useIjazah(id: string) {
  return useQuery({
    queryKey: ['ijazah', id],
    queryFn: async () => unwrap(await supabase.from('ijazahs').select('*').eq('id', id).single()),
  });
}

export function useIjazahForProgram(programId: string | null) {
  return useQuery({
    queryKey: ['ijazah-program', programId],
    enabled: !!programId,
    queryFn: async () =>
      unwrapMaybe(
        await supabase.from('ijazahs').select('*').eq('program_id', programId!).maybeSingle(),
      ),
  });
}

export function useMyIjazahs() {
  const uid = useAuthStore((s) => s.session?.user.id);
  return useQuery({
    queryKey: ['my-ijazahs', uid],
    enabled: !!uid,
    queryFn: async () =>
      unwrap(
        await supabase
          .from('ijazahs')
          .select('*')
          .eq('student_id', uid!)
          .order('issued_at', { ascending: false }),
      ),
  });
}

export function useIssueIjazah() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (programId: string) =>
      unwrap(await supabase.rpc('issue_ijazah', { p_program_id: programId })),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['programs'] });
      void qc.invalidateQueries({ queryKey: ['ijazah-program'] });
    },
  });
}

/** Public lookup by verification code (works signed out). */
export async function verifyIjazah(code: string): Promise<VerifiedIjazah | null> {
  const rows = unwrap(
    await supabase.rpc('verify_ijazah', { p_code: code }),
  ) as unknown as VerifiedIjazah[];
  return rows[0] ?? null;
}
