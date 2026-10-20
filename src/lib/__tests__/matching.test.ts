import { defaultFemaleOnly, teacherMatches } from '../matching';

const maleStudent = { gender: 'male' as const, female_teachers_only: false };
const femaleStudent = { gender: 'female' as const, female_teachers_only: true };
const femaleStudentAny = { gender: 'female' as const, female_teachers_only: false };

const maleTeachesAll = { gender: 'male' as const, teaches: 'both' as const };
const maleTeachesMen = { gender: 'male' as const, teaches: 'male' as const };
const femaleTeachesWomen = { gender: 'female' as const, teaches: 'female' as const };
const femaleTeachesAll = { gender: 'female' as const, teaches: 'both' as const };

describe('gender matching', () => {
  it('female students see female teachers only by default', () => {
    expect(defaultFemaleOnly('female')).toBe(true);
    expect(defaultFemaleOnly('male')).toBe(false);
    expect(teacherMatches(femaleStudent, maleTeachesAll)).toBe(false);
    expect(teacherMatches(femaleStudent, femaleTeachesWomen)).toBe(true);
    expect(teacherMatches(femaleStudent, femaleTeachesAll)).toBe(true);
  });

  it('female students who switch the setting off may see male teachers who teach women', () => {
    expect(teacherMatches(femaleStudentAny, maleTeachesAll)).toBe(true);
    expect(teacherMatches(femaleStudentAny, maleTeachesMen)).toBe(false);
  });

  it("respects the teacher's 'who I teach' setting", () => {
    expect(teacherMatches(maleStudent, femaleTeachesWomen)).toBe(false);
    expect(teacherMatches(maleStudent, femaleTeachesAll)).toBe(true);
    expect(teacherMatches(maleStudent, maleTeachesMen)).toBe(true);
    expect(teacherMatches(femaleStudentAny, maleTeachesMen)).toBe(false);
  });

  it('students without a gender yet are not filtered by the teacher setting', () => {
    expect(teacherMatches({ gender: null, female_teachers_only: false }, maleTeachesMen)).toBe(
      true,
    );
  });
});
