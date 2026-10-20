import { z } from 'zod';

// Messages are i18n keys, translated at render time.
export const signUpSchema = z.object({
  role: z.enum(['student', 'teacher']),
  fullName: z.string().trim().min(3, 'auth.errors.nameShort').max(120, 'auth.errors.nameShort'),
  email: z.string().trim().email('auth.errors.emailInvalid'),
  password: z.string().min(8, 'auth.errors.passwordShort'),
});
export type SignUpValues = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: z.string().trim().email('auth.errors.emailInvalid'),
  password: z.string().min(8, 'auth.errors.passwordShort'),
});
export type SignInValues = z.infer<typeof signInSchema>;

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{7,14}$/, 'auth.errors.phoneInvalid');
export const otpSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'auth.errors.otpInvalid');

/** Map Supabase auth errors to i18n keys. */
export function authErrorKey(e: unknown): string {
  const code = (e as { code?: string })?.code;
  const msg = ((e as { message?: string })?.message ?? '').toLowerCase();
  if (code === 'invalid_credentials' || msg.includes('invalid login'))
    return 'auth.errors.invalidCredentials';
  if (code === 'user_already_exists' || msg.includes('already registered'))
    return 'auth.errors.alreadyRegistered';
  if (code === 'phone_provider_disabled' || code === 'sms_send_failed')
    return 'common.notConfigured';
  return 'auth.errors.generic';
}
