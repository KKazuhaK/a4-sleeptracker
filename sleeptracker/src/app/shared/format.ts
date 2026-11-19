import { SleepData } from '../data/sleep-data';

/** "7 h 32 min", "45 min", "8 h". */
export function formatDuration(totalMinutes: number): string {
  const m = Math.max(0, Math.round(totalMinutes));
  const h = Math.floor(m / 60);
  const min = m % 60;
  if (h === 0) return `${min} min`;
  return min === 0 ? `${h} h` : `${h} h ${min} min`;
}

export function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** "Today", "Yesterday", otherwise "Mon, Nov 16". */
export function dayHeading(d: Date, now = new Date()): string {
  if (isSameDay(d, now)) return 'Today';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  return isSameDay(d, yesterday) ? 'Yesterday' : formatDate(d);
}

export interface DayGroup<T extends SleepData = SleepData> {
  key: string;
  heading: string;
  items: T[];
}

/** Group records by local day of loggedAt, keeping the input order (newest first). */
export function groupByDay<T extends SleepData>(records: T[]): DayGroup<T>[] {
  const groups: DayGroup<T>[] = [];
  for (const r of records) {
    const d = r.loggedAt;
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    let g = groups[groups.length - 1];
    if (!g || g.key !== key) {
      g = { key, heading: dayHeading(d), items: [] };
      groups.push(g);
    }
    g.items.push(r);
  }
  return groups;
}

export type Tier = 'low' | 'mid' | 'high';

export function sleepinessTier(value: number): Tier {
  return value <= 2 ? 'low' : value <= 4 ? 'mid' : 'high';
}

export function tierLabel(value: number): string {
  return { low: 'Alert', mid: 'A little sleepy', high: 'Very sleepy' }[sleepinessTier(value)];
}

/** Local ISO string without timezone, the format ion-datetime reads and emits. */
export function toLocalIso(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:00`;
}

/** Extract "HH:mm" from what ion-datetime emits for a time picker; null if unparsable. */
export function toHHmm(value: string): string | null {
  const part = value.includes('T') ? value.split('T')[1] : value;
  return /^\d{2}:\d{2}/.exec(part)?.[0] ?? null;
}

/** An arbitrary fixed date at HH:mm as a local ISO string; only the time part matters to the time picker. */
export function timeToIso(hhmm: string): string {
  return `2000-01-01T${hhmm}:00`;
}

/** Round a date down to a multiple of `minutes`. */
export function floorToMinutes(d: Date, minutes: number): Date {
  const r = new Date(d);
  r.setSeconds(0, 0);
  r.setMinutes(r.getMinutes() - (r.getMinutes() % minutes));
  return r;
}

/** Compact "7h 32m" for big numerals. */
export function formatDurationShort(totalMinutes: number): string {
  const m = Math.max(0, Math.round(totalMinutes));
  const h = Math.floor(m / 60);
  const min = m % 60;
  if (h === 0) return `${min}m`;
  return min === 0 ? `${h}h` : `${h}h ${min}m`;
}
