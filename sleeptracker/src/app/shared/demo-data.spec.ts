import { generateDemoData } from './demo-data';

describe('generateDemoData', () => {
  for (const hour of [5, 8, 12, 23]) {
    it(`creates valid, non-future entries when loaded at ${hour}:00`, () => {
      const now = new Date(2026, 10, 18, hour, 0);
      const { nights, levels } = generateDemoData(now);

      expect(nights.length).toBeGreaterThanOrEqual(13);
      expect(levels.length).toBeGreaterThan(30);
      for (const n of nights) {
        const hours = (n.end.getTime() - n.start.getTime()) / 3600000;
        expect(hours).toBeGreaterThan(3);
        expect(hours).toBeLessThan(12);
        expect(n.end.getTime()).toBeLessThanOrEqual(now.getTime());
        expect(n.quality).toBeGreaterThanOrEqual(1);
        expect(n.quality).toBeLessThanOrEqual(5);
      }
      for (const s of levels) {
        expect(Number.isInteger(s.value)).toBeTrue();
        expect(s.value).toBeGreaterThanOrEqual(1);
        expect(s.value).toBeLessThanOrEqual(7);
        expect(s.at.getTime()).toBeLessThanOrEqual(now.getTime());
      }
    });
  }

  it('is the same every time', () => {
    const now = new Date(2026, 10, 18, 12, 0);
    expect(generateDemoData(now)).toEqual(generateDemoData(now));
  });
});
