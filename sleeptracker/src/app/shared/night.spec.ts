import { minutesOfDay, nightOf, resolveNight } from './night';

const hm = (h: number, m = 0) => h * 60 + m;

describe('resolveNight', () => {
  const night = new Date(2026, 10, 14); // night of Sat Nov 14

  it('23:00 -> 07:00 crosses midnight', () => {
    const r = resolveNight(night, hm(23), hm(7))!;
    expect(r.start).toEqual(new Date(2026, 10, 14, 23, 0));
    expect(r.end).toEqual(new Date(2026, 10, 15, 7, 0));
  });

  it('00:30 -> 08:00 puts the bedtime after midnight (D+1)', () => {
    const r = resolveNight(night, hm(0, 30), hm(8))!;
    expect(r.start).toEqual(new Date(2026, 10, 15, 0, 30));
    expect(r.end).toEqual(new Date(2026, 10, 15, 8, 0));
  });

  it('13:00 -> 14:00 is a same-day nap-like window', () => {
    const r = resolveNight(night, hm(13), hm(14))!;
    expect(r.start).toEqual(new Date(2026, 10, 14, 13, 0));
    expect(r.end).toEqual(new Date(2026, 10, 14, 14, 0));
  });

  it('equal times are invalid', () => {
    expect(resolveNight(night, hm(22), hm(22))).toBeNull();
  });

  it('duration is always under 24 h', () => {
    for (const [b, w] of [[hm(23), hm(22, 55)], [hm(12), hm(11, 55)], [hm(0), hm(23, 55)]]) {
      const r = resolveNight(night, b, w)!;
      expect(r.end.getTime()).toBeGreaterThan(r.start.getTime());
      expect(r.end.getTime() - r.start.getTime()).toBeLessThanOrEqual(25 * 3600000);
    }
  });

  it('keeps wall-clock times across the US spring-forward night', () => {
    const r = resolveNight(new Date(2026, 2, 7), hm(23), hm(7))!;
    expect(r.start.getDate()).toBe(7);
    expect(r.start.getHours()).toBe(23);
    expect(r.end.getDate()).toBe(8);
    expect(r.end.getHours()).toBe(7);
  });
});

describe('nightOf', () => {
  it('uses the bed date for evening bedtimes', () => {
    expect(nightOf(new Date(2026, 10, 14, 23, 0), new Date(2026, 10, 15, 7, 0))).toEqual(new Date(2026, 10, 14));
  });
  it('uses wake date - 1 for after-midnight bedtimes', () => {
    expect(nightOf(new Date(2026, 10, 15, 0, 30), new Date(2026, 10, 15, 8, 0))).toEqual(new Date(2026, 10, 14));
  });
  it('morning bedtime with next-day wake keeps its night (bed 09:00 -> wake 01:00)', () => {
    expect(nightOf(new Date(2026, 10, 15, 9, 0), new Date(2026, 10, 16, 1, 0))).toEqual(new Date(2026, 10, 14));
  });
  it('morning bedtime 11:00 -> next-day 08:00', () => {
    expect(nightOf(new Date(2026, 10, 15, 11, 0), new Date(2026, 10, 16, 8, 0))).toEqual(new Date(2026, 10, 14));
  });
  it('minutesOfDay', () => {
    expect(minutesOfDay(new Date(2026, 10, 15, 7, 5))).toBe(425);
  });
});

describe('round trip nightOf -> resolveNight', () => {
  const records: [Date, Date][] = [
    [new Date(2026, 10, 14, 23, 0), new Date(2026, 10, 15, 7, 0)], // evening
    [new Date(2026, 10, 15, 0, 30), new Date(2026, 10, 15, 8, 0)], // after midnight
    [new Date(2026, 10, 15, 9, 0), new Date(2026, 10, 16, 1, 0)], // morning bed, next-day wake
    [new Date(2026, 10, 15, 11, 0), new Date(2026, 10, 16, 8, 0)],
    [new Date(2026, 10, 14, 13, 0), new Date(2026, 10, 14, 14, 0)], // nap
    [new Date(2026, 10, 14, 23, 0), new Date(2026, 10, 15, 22, 0)], // 23 h
    [new Date(2026, 2, 7, 23, 0), new Date(2026, 2, 8, 7, 0)], // US spring forward
    [new Date(2026, 10, 0 + 1, 23, 0), new Date(2026, 10, 2, 7, 0)], // US fall back night
  ];
  for (const [s, e] of records) {
    it(`${s.toISOString()} -> ${e.toISOString()}`, () => {
      const r = resolveNight(nightOf(s, e), minutesOfDay(s), minutesOfDay(e))!;
      expect(r.start.getTime()).toBe(s.getTime());
      expect(r.end.getTime()).toBe(e.getTime());
    });
  }
});
