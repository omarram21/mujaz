export type Gender = 'male' | 'female';
export type Teaches = 'male' | 'female' | 'both';

export interface StudentPrefs {
  gender: Gender | null;
  female_teachers_only: boolean;
}
export interface TeacherProfile {
  gender: Gender | null;
  teaches: Teaches;
}

/**
 * Whether a student and teacher can be matched (mirrors public.teacher_matches):
 * the teacher must teach the student's gender, and a student who chose
 * "female teachers only" is matched with female teachers only.
 */
export function teacherMatches(student: StudentPrefs, teacher: TeacherProfile): boolean {
  const teachesStudent =
    teacher.teaches === 'both' || student.gender === null || teacher.teaches === student.gender;
  const respectsPreference = !student.female_teachers_only || teacher.gender === 'female';
  return teachesStudent && respectsPreference;
}

/** Default for the "female teachers only" setting when a student sets their gender. */
export function defaultFemaleOnly(gender: Gender): boolean {
  return gender === 'female';
}
