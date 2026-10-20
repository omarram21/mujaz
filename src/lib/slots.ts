import { addDays, addMinutes } from 'date-fns';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

export interface AvailabilityRule {
  weekday: number; // 0 = Sunday, in `timezone`
  start_time: string; // "HH:MM" or "HH:MM:SS"
  end_time: string;
  timezone: string;
}

export interface Interval {
  starts_at: string | Date;
  ends_at: string | Date;
}

export interface SlotOptions {
  rules: readonly AvailabilityRule[];
  /** Existing bookings and blocked ranges of the teacher. */
  busy?: readonly Interval[];
  from: Date;
  to: Date;
  durationMin: 30 | 60;
  now?: Date;
  /** Minimum notice before a session can start (server enforces 60). */
  leadMinutes?: number;
  stepMinutes?: number;
}

const toMinutes = (t: string): number => {
  const [h = '0', m = '0'] = t.split(':');
  return Number(h) * 60 + Number(m);
};
const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Bookable start instants (UTC) for a teacher. Rules are wall-clock hours in the
 * teacher's zone, so each slot is resolved through that zone — DST and zone offsets
 * are handled per day. Mirrors public.slot_fits_availability on the server.
 */
export function generateSlots({
  rules,
  busy = [],
  from,
  to,
  durationMin,
  now = new Date(),
  leadMinutes = 60,
  stepMinutes = 30,
}: SlotOptions): Date[] {
  const earliest = Math.max(from.getTime(), now.getTime() + leadMinutes * 60_000);
  const busyMs = busy.map(
    (b) => [new Date(b.starts_at).getTime(), new Date(b.ends_at).getTime()] as const,
  );
  const out = new Map<number, Date>();

  for (const rule of rules) {
    const startMin = toMinutes(rule.start_time);
    const endMin = toMinutes(rule.end_time);
    // Walk the calendar dates (in the rule's zone) that intersect [from, to], with a day of margin.
    const firstDay = formatInTimeZone(addDays(from, -1), rule.timezone, 'yyyy-MM-dd');
    const lastDay = formatInTimeZone(addDays(to, 1), rule.timezone, 'yyyy-MM-dd');
    for (let day = firstDay; day <= lastDay; day = nextDay(day)) {
      if (weekdayOf(day) !== rule.weekday) continue;
      for (let m = startMin; m + durationMin <= endMin; m += stepMinutes) {
        const start = fromZonedTime(
          `${day}T${pad(Math.floor(m / 60))}:${pad(m % 60)}:00`,
          rule.timezone,
        );
        const end = addMinutes(start, durationMin);
        const s = start.getTime();
        if (s < earliest || s >= to.getTime()) continue;
        // A DST jump can shift the wall clock; require the local end to stay inside the rule.
        const localEnd = toMinutes(formatInTimeZone(end, rule.timezone, 'HH:mm')) || 1440; // 00:00 = end of day
        const localDay = formatInTimeZone(start, rule.timezone, 'yyyy-MM-dd');
        if (localDay !== day || localEnd > endMin) continue;
        if (busyMs.some(([bs, be]) => s < be && end.getTime() > bs)) continue;
        out.set(s, start);
      }
    }
  }
  return [...out.values()].sort((a, b) => a.getTime() - b.getTime());
}

function nextDay(day: string): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function weekdayOf(day: string): number {
  return new Date(`${day}T12:00:00Z`).getUTCDay();
}

/** Group slots by calendar date in the viewer's zone ("yyyy-MM-dd" → slots). */
export function groupByDay(slots: readonly Date[], timeZone: string): Map<string, Date[]> {
  const map = new Map<string, Date[]>();
  for (const s of slots) {
    const k = formatInTimeZone(s, timeZone, 'yyyy-MM-dd');
    const list = map.get(k);
    if (list) list.push(s);
    else map.set(k, [s]);
  }
  return map;
}

/** Whether two half-open intervals overlap (same rule as the DB exclusion constraint). */
export function overlaps(a: Interval, b: Interval): boolean {
  return (
    new Date(a.starts_at).getTime() < new Date(b.ends_at).getTime() &&
    new Date(b.starts_at).getTime() < new Date(a.ends_at).getTime()
  );
}
