import { canJoin, canStudentChange } from '@/features/booking/api';
import { normalizeRules } from '@/features/availability/api';
import { formatClock, formatRange } from '@/features/availability/clock';
import { prepHint } from '@/features/progress/api';

jest.mock('@/services/supabase', () => ({
  supabase: {},
  unwrap: jest.fn(),
  unwrapMaybe: jest.fn(),
}));
jest.mock('@/services/notifications', () => ({ syncSessionReminders: jest.fn() }));

const at = (iso: string) => new Date(iso);
const booking = {
  starts_at: '2026-11-01T18:00:00Z',
  ends_at: '2026-11-01T18:30:00Z',
  status: 'scheduled' as const,
};

describe('join window', () => {
  it('opens 10 minutes before the start and closes at the end', () => {
    expect(canJoin(booking, at('2026-11-01T17:49:00Z'))).toBe(false);
    expect(canJoin(booking, at('2026-11-01T17:50:00Z'))).toBe(true);
    expect(canJoin(booking, at('2026-11-01T18:29:00Z'))).toBe(true);
    expect(canJoin(booking, at('2026-11-01T18:30:00Z'))).toBe(false);
    expect(canJoin({ ...booking, status: 'cancelled' }, at('2026-11-01T18:00:00Z'))).toBe(false);
  });
});

describe('free cancellation window', () => {
  it('allows changes until 6 hours before', () => {
    expect(canStudentChange(booking, at('2026-11-01T12:00:00Z'))).toBe(true);
    expect(canStudentChange(booking, at('2026-11-01T12:00:01Z'))).toBe(false);
    expect(canStudentChange({ ...booking, status: 'completed' }, at('2026-10-01T00:00:00Z'))).toBe(
      false,
    );
  });
});

describe('availability rules', () => {
  it('merges overlapping and adjacent ranges per day', () => {
    expect(
      normalizeRules([
        { weekday: 0, start: 1080, end: 1200 },
        { weekday: 0, start: 1140, end: 1320 },
        { weekday: 0, start: 1320, end: 1380 },
        { weekday: 1, start: 540, end: 600 },
        { weekday: 1, start: 700, end: 650 },
      ]),
    ).toEqual([
      { weekday: 0, start: 1080, end: 1380 },
      { weekday: 1, start: 540, end: 600 },
    ]);
  });

  it('formats clock times and ranges', () => {
    expect(formatClock(1080, 'ar')).toBe('٦:٠٠ م');
    expect(formatClock(0, 'en')).toBe('12:00 AM');
    expect(formatRange(1080, 1320, 'ar')).toBe('٦:٠٠ — ١٠:٠٠ م');
    expect(formatRange(540, 660, 'en')).toBe('9:00 — 11:00 AM');
    expect(formatRange(600, 780, 'en')).toBe('10:00 AM — 1:00 PM');
  });
});

describe('what to prepare', () => {
  it('starts at page 1 for a new khatmah', () => {
    expect(prepHint([])).toMatchObject({ fromPage: 1, toPage: 3 });
  });
  it('continues after the furthest page with the last session length', () => {
    expect(
      prepHint([
        { from_page: 1, to_page: 5 },
        { from_page: 6, to_page: 8 },
      ]),
    ).toMatchObject({ fromPage: 9, toPage: 11 });
  });
  it('is empty when the khatmah is complete', () => {
    expect(prepHint([{ from_page: 1, to_page: 604 }])).toBeNull();
  });
});
