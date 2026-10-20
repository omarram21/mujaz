import { useQuery } from '@tanstack/react-query';
import { supabase, unwrap } from '@/services/supabase';
import type { Tables } from '@/lib/database.types';
import type { AppLocale } from '@/lib/formatNumber';

export type Riwayah = Tables<'riwayat'>;

export function useRiwayat() {
  return useQuery({
    queryKey: ['riwayat'],
    queryFn: async () => unwrap(await supabase.from('riwayat').select('*').order('sort')),
    staleTime: Infinity,
  });
}

export function riwayahName(list: Riwayah[] | undefined, code: string, locale: AppLocale): string {
  const r = list?.find((x) => x.code === code);
  return r ? (locale === 'ar' ? r.name_ar : r.name_en) : code;
}
