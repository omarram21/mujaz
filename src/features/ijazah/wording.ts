import type { TFunction } from 'i18next';

type G = 'male' | 'female' | null | undefined;
const g = (x: G) => (x === 'female' ? 'f' : 'm');

/** Certificate sentences with Arabic gender agreement for student and teacher. */
export function certificateText(
  t: TFunction,
  p: { teacherName: string; studentGender: G; teacherGender: G },
): { witness: string; bodyBefore: string; bodyAfter: string } {
  const key = `${g(p.studentGender)}${g(p.teacherGender)}`;
  return {
    witness: t(`ijazah.witness_${g(p.teacherGender)}_${g(p.studentGender)}`, {
      teacher: p.teacherName,
    }),
    bodyBefore: t(`ijazah.bodyBefore_${key}`),
    bodyAfter: t(`ijazah.bodyAfter_${key}`),
  };
}
