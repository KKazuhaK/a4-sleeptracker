/**
 * Two weeks of realistic sample data for demos: a college student's week with
 * late weekday nights, sleeping in on weekends and one short pre-exam night.
 * Sleepiness is logged three times a day and tracks how much the person slept.
 * A fixed seed keeps the demo the same every time it is loaded.
 */

export interface DemoNight {
  start: Date;
  end: Date;
  quality: number;
  note?: string;
}

export interface DemoSleepiness {
  value: number;
  at: Date;
  note?: string;
}

/** Small seeded PRNG (mulberry32) so the demo is reproducible. */
function seeded(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Date at a local wall-clock time `minutes` after midnight of `day` (may exceed 24 h). */
function at(day: Date, minutes: number): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, minutes);
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const round5 = (m: number) => Math.round(m / 5) * 5;

export function generateDemoData(now: Date = new Date(), nights = 14): { nights: DemoNight[]; levels: DemoSleepiness[] } {
  const rand = seeded(133);
  const out: { nights: DemoNight[]; levels: DemoSleepiness[] } = { nights: [], levels: [] };
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  for (let back = nights; back >= 1; back--) {
    // The night of `evening` ends on the morning of `morning`.
    const evening = new Date(today.getFullYear(), today.getMonth(), today.getDate() - back);
    const morning = new Date(evening.getFullYear(), evening.getMonth(), evening.getDate() + 1);
    const weekendNight = evening.getDay() === 5 || evening.getDay() === 6; // Fri/Sat nights
    const examNight = back === 4;

    // Bedtime as minutes after midnight of `evening` (e.g. 1410 = 11:30 PM, 1500 = 1:00 AM).
    let bed = weekendNight ? 1470 + rand() * 90 : 1380 + rand() * 120;
    // Wake time as minutes after midnight of `morning`.
    let wake = weekendNight ? 570 + rand() * 80 : 420 + rand() * 75;
    if (examNight) {
      bed = 1530;
      wake = 410;
    }
    const start = at(evening, round5(bed));
    const end = at(morning, round5(wake));
    if (end.getTime() > now.getTime()) continue; // never create future entries

    const hours = (end.getTime() - start.getTime()) / 3600000;
    const quality = clamp(Math.round(hours - 3.5 + (rand() - 0.5)), 1, 5);
    const note = examNight
      ? 'Up late studying for a midterm'
      : weekendNight && rand() > 0.5
        ? 'Slept in'
        : rand() > 0.85
          ? 'Woke up once around 4'
          : undefined;
    out.nights.push({ start, end, quality, note });

    // Sleep debt pushes sleepiness up; the post-lunch dip and evening add a little.
    const debt = clamp((8 - hours) / 1.2, -1, 3);
    const samples: Array<[number, number, string | undefined]> = [
      [555 + rand() * 40, 0, rand() > 0.7 ? 'Before coffee' : undefined],
      [810 + rand() * 60, 1, rand() > 0.6 ? 'After lunch, in lecture' : undefined],
      [1260 + rand() * 60, 1.5, undefined],
    ];
    for (const [minutes, bump, sNote] of samples) {
      const when = at(morning, round5(minutes));
      if (when.getTime() > now.getTime()) continue;
      const value = clamp(Math.round(2 + debt + bump + (rand() - 0.5) * 1.2), 1, 7);
      out.levels.push({ value, at: when, note: sNote });
    }
  }
  return out;
}
