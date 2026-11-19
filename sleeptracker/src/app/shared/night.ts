/** Pure helpers for turning "night of D" + two times of day into real bed/wake dates. */

export interface NightRange {
  start: Date;
  end: Date;
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Local date + minutes-of-day, built via the constructor so DST shifts are handled by the platform. */
function at(day: Date, offsetDays: number, minutes: number): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate() + offsetDays, Math.floor(minutes / 60), minutes % 60);
}

export function minutesOfDay(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

/**
 * Night of D: bed on the evening of D (time >= 12:00) or early morning of D+1 (time < 12:00);
 * wake is the first occurrence of the wake time strictly after bed. Equal times are invalid (null).
 */
export function resolveNight(night: Date, bedMin: number, wakeMin: number): NightRange | null {
  if (bedMin === wakeMin) return null;
  const start = at(night, bedMin >= 720 ? 0 : 1, bedMin);
  let end = at(start, 0, wakeMin);
  if (end.getTime() <= start.getTime()) end = at(start, 1, wakeMin);
  return { start, end };
}

/** Night date of an existing record: bed date for afternoon/evening bedtimes, the day before for morning ones. */
export function nightOf(start: Date, end: Date): Date {
  void end;
  const d = startOfDay(start);
  if (start.getHours() < 12) d.setDate(d.getDate() - 1);
  return d;
}
