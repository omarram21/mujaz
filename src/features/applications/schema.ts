import { z } from 'zod';

const price = z
  .string()
  .trim()
  .regex(/^\d{1,4}(\.\d{1,2})?$/, 'apply.errors.price');

export const applySchema = z.object({
  gender: z.enum(['male', 'female'], { message: 'setup.errors.gender' }),
  country: z.string({ message: 'setup.errors.country' }).length(2, 'setup.errors.country'),
  timezone: z.string().min(1),
  teaches: z.enum(['male', 'female', 'both']),
  years: z
    .string()
    .trim()
    .regex(/^\d{1,2}$/, 'apply.errors.years'),
  headline: z.string().trim().min(3, 'apply.errors.headline').max(160, 'apply.errors.headline'),
  bio: z.string().trim().max(2000),
  price30: price,
  price60: price,
  riwayat: z.array(z.string()).min(1, 'apply.errors.riwayat'),
  grantingSheikh: z.string().trim().min(3, 'apply.errors.granting').max(200),
  sanad: z.string().trim().min(20, 'apply.errors.sanad').max(5000),
});
export type ApplyValues = z.infer<typeof applySchema>;

export const STEP_FIELDS: Record<1 | 2 | 3, (keyof ApplyValues)[]> = {
  1: ['gender', 'country', 'timezone', 'teaches', 'years'],
  2: ['headline', 'bio', 'price30', 'price60'],
  3: ['riwayat', 'grantingSheikh', 'sanad'],
};

/** Map server errors raised by the application trigger to i18n keys. */
export function applyErrorKey(e: unknown): string {
  const msg = (e as { message?: string })?.message ?? '';
  if (msg.includes('application_needs_documents')) return 'apply.errors.documents';
  if (msg.includes('application_incomplete')) return 'apply.errors.incomplete';
  if ((e as { code?: string })?.code === 'too_large') return 'apply.errors.tooLarge';
  if ((e as { code?: string })?.code === 'bad_type') return 'apply.errors.badType';
  return 'auth.errors.generic';
}
