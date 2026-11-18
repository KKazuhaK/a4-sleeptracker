import { Component, Input } from '@angular/core';
import { Tier, formatDurationShort, sleepinessTier } from './format';

export interface WeekDay {
  /** Weekday initial, e.g. "M". */
  initial: string;
  /** Full weekday name for the aria label. */
  name: string;
  minutes: number;
  /** Average sleepiness that day, 0 when none. */
  sleepiness: number;
  today: boolean;
}

let nextId = 0;
const BASE = 110; // y of the bar baseline
const SCALE = 10; // hours at the top of the track
const TOP = 10;
const LEFT = 24;
const SLOT = (300 - LEFT) / 7;

/** Seven bars of sleep duration plus a row of daily-average sleepiness dots. */
@Component({
  selector: 'app-week-chart',
  templateUrl: 'week-chart.component.html',
  styleUrls: ['week-chart.component.scss'],
})
export class WeekChartComponent {
  @Input({ required: true }) days: WeekDay[] = [];

  readonly gid = `bar-grad-${nextId++}`;
  readonly base = BASE;
  readonly top = TOP;
  readonly guideY = BASE - (8 / SCALE) * (BASE - TOP);

  /** Averages come from the same 7 day buckets as the bars (days with data only). */
  get avgMinutes() {
    const v = this.days.filter((d) => d.minutes > 0).map((d) => d.minutes);
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
  }
  get avgSleepiness() {
    const v = this.days.filter((d) => d.sleepiness > 0).map((d) => d.sleepiness);
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
  }

  get summary(): string {
    const sleep = this.avgMinutes > 0 ? formatDurationShort(this.avgMinutes) : '–';
    const sl = this.avgSleepiness > 0 ? this.avgSleepiness.toFixed(1) : '–';
    return `Avg ${sleep} · Sleepiness avg ${sl}`;
  }

  get label(): string {
    const parts = this.days.map((d) => `${d.name} ${d.minutes ? formatDurationShort(d.minutes) : 'no data'}`);
    return `Sleep over the last 7 days. ${this.summary}. ${parts.join(', ')}.`;
  }

  /** Geometry for one day. */
  bar(i: number, d: WeekDay) {
    const cx = LEFT + SLOT * i + SLOT / 2;
    const h = Math.min(d.minutes / 60, SCALE) / SCALE * (BASE - TOP);
    return { cx, x: cx - 9, h, y: BASE - h, over: d.minutes / 60 > SCALE, tier: (d.sleepiness ? sleepinessTier(Math.round(d.sleepiness)) : null) as Tier | null };
  }
  trackH = BASE - TOP;
  rounded(v: number) { return Math.round(v); }
}
