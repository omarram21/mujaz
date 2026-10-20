import { generateSlots, groupByDay, overlaps } from '../slots';

const cairoEvening = {
  weekday: 0,
  start_time: '18:00',
  end_time: '20:00',
  timezone: 'Africa/Cairo',
};

describe('slot generation across time zones', () => {
  // Sunday 2026-11-01. Cairo is UTC+2 in November.
  const from = new Date('2026-11-01T00:00:00Z');
  const to = new Date('2026-11-02T00:00:00Z');
  const now = new Date('2026-10-25T00:00:00Z');

  it("creates 30-minute slots inside the teacher's local hours", () => {
    const slots = generateSlots({ rules: [cairoEvening], from, to, durationMin: 30, now });
    expect(slots.map((s) => s.toISOString())).toEqual([
      '2026-11-01T16:00:00.000Z',
      '2026-11-01T16:30:00.000Z',
      '2026-11-01T17:00:00.000Z',
      '2026-11-01T17:30:00.000Z',
    ]);
  });

  it('60-minute sessions must end before the rule ends', () => {
    const slots = generateSlots({ rules: [cairoEvening], from, to, durationMin: 60, now });
    expect(slots.map((s) => s.toISOString())).toEqual([
      '2026-11-01T16:00:00.000Z',
      '2026-11-01T16:30:00.000Z',
      '2026-11-01T17:00:00.000Z',
    ]);
  });

  it("shows the same instants in the student's own zone", () => {
    const slots = generateSlots({ rules: [cairoEvening], from, to, durationMin: 30, now });
    // A student in London (UTC+0 in November) sees 16:00; one in Tokyo sees 01:00 next day.
    const london = groupByDay(slots, 'Europe/London');
    const tokyo = groupByDay(slots, 'Asia/Tokyo');
    expect([...london.keys()]).toEqual(['2026-11-01']);
    expect([...tokyo.keys()]).toEqual(['2026-11-02']);
  });

  it('follows DST changes in the teacher zone', () => {
    // New York leaves DST on Sunday 2026-11-01: 18:00 local is 22:00Z the week before, 23:00Z after.
    const rule = {
      weekday: 0,
      start_time: '18:00',
      end_time: '18:30',
      timezone: 'America/New_York',
    };
    const slots = generateSlots({
      rules: [rule],
      from: new Date('2026-10-25T00:00:00Z'),
      to: new Date('2026-11-02T12:00:00Z'),
      durationMin: 30,
      now: new Date('2026-10-01T00:00:00Z'),
    });
    expect(slots.map((s) => s.toISOString())).toEqual([
      '2026-10-25T22:00:00.000Z',
      '2026-11-01T23:00:00.000Z',
    ]);
  });

  it('handles zones with half-hour offsets', () => {
    const rule = { weekday: 1, start_time: '09:00', end_time: '10:00', timezone: 'Asia/Kolkata' };
    const slots = generateSlots({
      rules: [rule],
      from: new Date('2026-11-02T00:00:00Z'),
      to: new Date('2026-11-03T00:00:00Z'),
      durationMin: 30,
      now,
    });
    expect(slots.map((s) => s.toISOString())).toEqual([
      '2026-11-02T03:30:00.000Z',
      '2026-11-02T04:00:00.000Z',
    ]);
  });

  it('removes booked and blocked intervals, including partial overlaps', () => {
    const slots = generateSlots({
      rules: [cairoEvening],
      busy: [{ starts_at: '2026-11-01T16:15:00Z', ends_at: '2026-11-01T16:45:00Z' }],
      from,
      to,
      durationMin: 30,
      now,
    });
    expect(slots.map((s) => s.toISOString())).toEqual([
      '2026-11-01T17:00:00.000Z',
      '2026-11-01T17:30:00.000Z',
    ]);
  });

  it('respects the minimum notice before a session', () => {
    const slots = generateSlots({
      rules: [cairoEvening],
      from,
      to,
      durationMin: 30,
      now: new Date('2026-11-01T15:10:00Z'),
      leadMinutes: 60,
    });
    expect(slots[0]?.toISOString()).toBe('2026-11-01T16:30:00.000Z');
  });

  it('merges overlapping rules without duplicates', () => {
    const slots = generateSlots({
      rules: [cairoEvening, { ...cairoEvening, start_time: '19:00', end_time: '21:00' }],
      from,
      to,
      durationMin: 30,
      now,
    });
    expect(slots).toHaveLength(6);
  });
});

describe('double-booking overlap rule', () => {
  const a = { starts_at: '2026-11-01T16:00:00Z', ends_at: '2026-11-01T16:30:00Z' };
  it('detects overlap', () => {
    expect(
      overlaps(a, { starts_at: '2026-11-01T16:15:00Z', ends_at: '2026-11-01T17:15:00Z' }),
    ).toBe(true);
    expect(
      overlaps(a, { starts_at: '2026-11-01T15:30:00Z', ends_at: '2026-11-01T17:00:00Z' }),
    ).toBe(true);
  });
  it('allows back-to-back sessions (half-open intervals)', () => {
    expect(
      overlaps(a, { starts_at: '2026-11-01T16:30:00Z', ends_at: '2026-11-01T17:00:00Z' }),
    ).toBe(false);
    expect(
      overlaps(a, { starts_at: '2026-11-01T15:30:00Z', ends_at: '2026-11-01T16:00:00Z' }),
    ).toBe(false);
  });
});
