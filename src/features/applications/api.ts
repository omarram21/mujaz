import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, unwrap, unwrapMaybe } from '@/services/supabase';
import type { Tables, TablesUpdate } from '@/lib/database.types';
import { useAuthStore } from '@/features/auth/store';
import { refreshProfile } from '@/features/auth/api';

export type Application = Tables<'teacher_applications'>;
export type TeacherDocument = Tables<'teacher_documents'>;

const BUCKET = 'teacher-documents';
export const MAX_DOC_BYTES = 10 * 1024 * 1024;
export const ALLOWED_MIME = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/webp',
];

const keys = {
  mine: ['applications', 'mine'] as const,
  docs: (id: string) => ['applications', id, 'documents'] as const,
  pending: ['applications', 'pending'] as const,
  one: (id: string) => ['applications', id] as const,
};

/** The teacher's most recent application (any status). */
export function useMyApplication() {
  const uid = useAuthStore((s) => s.session?.user.id);
  return useQuery({
    queryKey: keys.mine,
    enabled: !!uid,
    queryFn: async () =>
      unwrapMaybe(
        await supabase
          .from('teacher_applications')
          .select('*')
          .eq('teacher_id', uid!)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ),
  });
}

/** Returns the open draft, creating one (prefilled from the last application/profile) if needed. */
export async function ensureDraft(): Promise<Application> {
  const state = useAuthStore.getState();
  const uid = state.session?.user.id;
  const profile = state.profile;
  if (!uid || !profile) throw new Error('not signed in');
  const existing = unwrapMaybe(
    await supabase
      .from('teacher_applications')
      .select('*')
      .eq('teacher_id', uid)
      .in('status', ['draft', 'pending'])
      .maybeSingle(),
  );
  if (existing) return existing;
  const last = unwrapMaybe(
    await supabase
      .from('teacher_applications')
      .select('*')
      .eq('teacher_id', uid)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  );
  return unwrap(
    await supabase
      .from('teacher_applications')
      .insert({
        teacher_id: uid,
        status: 'draft',
        gender: last?.gender ?? profile.gender,
        country: last?.country ?? profile.country,
        teaches: last?.teaches ?? profile.teaches,
        riwayat: last?.riwayat ?? [],
        granting_sheikh: last?.granting_sheikh ?? profile.granting_sheikh,
        sanad_text: last?.sanad_text ?? profile.sanad_text,
        headline: last?.headline ?? profile.headline,
        bio: last?.bio ?? profile.bio,
        years_experience: last?.years_experience ?? profile.years_experience,
        price_30: last?.price_30 ?? profile.price_30,
        price_60: last?.price_60 ?? profile.price_60,
      })
      .select('*')
      .single(),
  );
}

export function useDraft() {
  return useQuery({
    queryKey: ['applications', 'draft'],
    queryFn: ensureDraft,
    staleTime: Infinity,
  });
}

export function useUpdateDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: TablesUpdate<'teacher_applications'>;
    }) =>
      unwrap(
        await supabase.from('teacher_applications').update(patch).eq('id', id).select('*').single(),
      ),
    onSuccess: (app) => {
      qc.setQueryData(['applications', 'draft'], app);
      void qc.invalidateQueries({ queryKey: keys.mine });
    },
  });
}

export function useSubmitApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      unwrap(
        await supabase
          .from('teacher_applications')
          .update({ status: 'pending' })
          .eq('id', id)
          .select('*')
          .single(),
      ),
    onSuccess: async () => {
      await refreshProfile();
      void qc.invalidateQueries({ queryKey: ['applications'] });
    },
  });
}

// Documents ---------------------------------------------------------------------------

export function useDocuments(applicationId: string | undefined) {
  return useQuery({
    queryKey: keys.docs(applicationId ?? 'none'),
    enabled: !!applicationId,
    queryFn: async () =>
      unwrap(
        await supabase
          .from('teacher_documents')
          .select('*')
          .eq('application_id', applicationId!)
          .order('created_at'),
      ),
  });
}

export interface PickedFile {
  uri: string;
  name: string;
  mimeType: string;
  size: number;
}

function safeName(name: string): string {
  const cleaned = name
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '_')
    .slice(-80);
  return cleaned || 'document';
}

export function useUploadDocument(applicationId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: PickedFile) => {
      const uid = useAuthStore.getState().session?.user.id;
      if (!uid || !applicationId) throw new Error('not ready');
      if (file.size > MAX_DOC_BYTES)
        throw Object.assign(new Error('too_large'), { code: 'too_large' });
      if (!ALLOWED_MIME.includes(file.mimeType))
        throw Object.assign(new Error('bad_type'), { code: 'bad_type' });
      const path = `${uid}/${applicationId}/${Date.now()}-${safeName(file.name)}`;
      const body = await (await fetch(file.uri)).arrayBuffer();
      const up = await supabase.storage
        .from(BUCKET)
        .upload(path, body, { contentType: file.mimeType });
      if (up.error) throw up.error;
      return unwrap(
        await supabase
          .from('teacher_documents')
          .insert({
            application_id: applicationId,
            teacher_id: uid,
            storage_path: path,
            file_name: file.name.slice(0, 255),
            mime_type: file.mimeType,
            size_bytes: file.size,
          })
          .select('*')
          .single(),
      );
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.docs(applicationId ?? 'none') }),
  });
}

export function useDeleteDocument(applicationId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (doc: TeacherDocument) => {
      unwrapMaybe(await supabase.from('teacher_documents').delete().eq('id', doc.id));
      await supabase.storage.from(BUCKET).remove([doc.storage_path]);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.docs(applicationId ?? 'none') }),
  });
}

/** Short-lived link to view a private document (owner or admin). */
export async function documentUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 300);
  if (error) throw error;
  return data.signedUrl;
}

// Admin ---------------------------------------------------------------------------------

export type ApplicationWithTeacher = Application & {
  teacher: Pick<Tables<'profiles'>, 'id' | 'full_name' | 'country'> | null;
};

export function usePendingApplications() {
  return useQuery({
    queryKey: keys.pending,
    queryFn: async () =>
      unwrap(
        await supabase
          .from('teacher_applications')
          .select(
            '*, teacher:profiles!teacher_applications_teacher_id_fkey(id, full_name, country)',
          )
          .eq('status', 'pending')
          .order('submitted_at', { ascending: true }),
      ) as ApplicationWithTeacher[],
  });
}

export function useApplication(id: string) {
  return useQuery({
    queryKey: keys.one(id),
    queryFn: async () =>
      unwrap(
        await supabase
          .from('teacher_applications')
          .select(
            '*, teacher:profiles!teacher_applications_teacher_id_fkey(id, full_name, country)',
          )
          .eq('id', id)
          .single(),
      ) as ApplicationWithTeacher,
  });
}

export function useReviewApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      approve: boolean;
      reason?: string;
      checklist: Record<string, boolean>;
    }) =>
      unwrap(
        await supabase.rpc('review_teacher_application', {
          p_application_id: input.id,
          p_approve: input.approve,
          p_reason: input.reason,
          p_checklist: input.checklist,
        }),
      ),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['applications'] }),
  });
}

export const CHECKLIST_KEYS = ['certificate', 'sanad', 'call'] as const;
export type ChecklistKey = (typeof CHECKLIST_KEYS)[number];
