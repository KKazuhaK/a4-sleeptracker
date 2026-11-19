import { Component, EventEmitter, Input, Output } from '@angular/core';
import { formatDurationShort } from './format';
import { hapticTick } from './haptics';
import { minutesOfDay } from './night';

let nextId = 0;
const CX = 100;
const CY = 100;
const R = 76;
const SNAP = 5;

/** Point on the ring for an angle in degrees (0 = top, clockwise). */
function polar(deg: number, r = R): { x: number; y: number } {
  const a = (deg * Math.PI) / 180;
  return { x: CX + r * Math.sin(a), y: CY - r * Math.cos(a) };
}

function clock(min: number): string {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  return `${h % 12 || 12}:${String(m % 60).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

type Handle = 'bed' | 'wake';

/**
 * 24-hour clock face with the sleep window as an arc from bed to wake.
 * Read-only by default; with `editable` the moon and sun handles can be dragged.
 */
@Component({
  selector: 'app-sleep-dial',
  templateUrl: 'sleep-dial.component.html',
  styleUrls: ['sleep-dial.component.scss'],
})
export class SleepDialComponent {
  @Input() start?: Date | null;
  @Input() end?: Date | null;
  @Input() quality?: number;
  @Input() emptyText = 'No sleep logged for last night';
  /** Editable mode is driven by minutes-of-day instead of dates. */
  @Input() editable = false;
  @Input() bedMin = 23 * 60;
  @Input() wakeMin = 7 * 60;
  /** Real elapsed minutes (differs from the clock difference on DST nights); used for the centre label. */
  @Input() durationMinutes?: number | null;
  @Output() bedMinChange = new EventEmitter<number>();
  @Output() wakeMinChange = new EventEmitter<number>();

  readonly gid = `dial-grad-${nextId++}`;
  readonly ticks = [0, 6, 12, 18].map((h) => ({
    label: String(h),
    line: { a: polar(h * 15, R + 12), b: polar(h * 15, R + 17) },
    text: polar(h * 15, R + 27),
  }));

  private dragging?: Handle;
  private lastBucket = -1;

  /** Bed/wake as minutes of day, or null when there is nothing to draw. */
  get bedM(): number | null {
    return this.editable ? this.bedMin : this.start ? minutesOfDay(this.start) : null;
  }
  get wakeM(): number | null {
    return this.editable ? this.wakeMin : this.end ? minutesOfDay(this.end) : null;
  }

  /** Window length in minutes (editable: always < 24 h, 0 when equal). */
  get minutes(): number {
    if (this.editable) return (this.wakeMin - this.bedMin + 1440) % 1440;
    return this.start && this.end ? Math.round((this.end.getTime() - this.start.getTime()) / 60000) : 0;
  }

  get hasWindow() { return this.bedM !== null && this.wakeM !== null && (this.editable || this.minutes > 0); }
  get hasArc() { return this.hasWindow && this.minutes > 0; }

  private angleOf(min: number) { return (min / 1440) * 360; }
  get startPt() { return polar(this.angleOf(this.bedM ?? 0)); }
  get endPt() { return polar(this.angleOf(this.wakeM ?? 0)); }

  /** Clockwise sweep in degrees from the bed angle to the wake angle. */
  private get sweepDeg() {
    return ((this.angleOf(this.wakeM ?? 0) - this.angleOf(this.bedM ?? 0)) % 360 + 360) % 360;
  }

  /**
   * SVG arc path clockwise from bed to wake, using the angle difference so the arc always stays on the ring.
   * Equal angles with a real duration (e.g. exactly 24 h) draw a full ring as two half arcs.
   */
  get arcPath(): string {
    const a = this.startPt;
    const b = this.endPt;
    const sweep = this.sweepDeg;
    if (sweep === 0) {
      const o = polar(this.angleOf(this.bedM ?? 0) + 180);
      return `M ${a.x} ${a.y} A ${R} ${R} 0 1 1 ${o.x} ${o.y} A ${R} ${R} 0 1 1 ${a.x} ${a.y}`;
    }
    return `M ${a.x} ${a.y} A ${R} ${R} 0 ${sweep > 180 ? 1 : 0} 1 ${b.x} ${b.y}`;
  }

  /** Empty-state copy split over two lines to fit inside the ring. */
  get emptyLines(): string[] {
    const words = this.emptyText.split(' ');
    const mid = Math.ceil(words.length / 2);
    return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')].filter(Boolean);
  }

  get duration() {
    const m = this.durationMinutes ?? this.minutes;
    return m > 0 ? formatDurationShort(m) : '–';
  }
  /** Font size for the centre value so long durations ("18h 45m") stay inside the ring. */
  get durationSize() {
    const len = this.duration.length;
    return len <= 4 ? 34 : len <= 6 ? 30 : 25;
  }
  get times() { return `${clock(this.bedM ?? 0)} – ${clock(this.wakeM ?? 0)}`; }
  bedText() { return `Bedtime ${clock(this.bedMin)}`; }
  wakeText() { return `Wake up ${clock(this.wakeMin)}`; }

  get label(): string {
    if (!this.hasWindow) return this.emptyText;
    const q = this.quality ? `, quality ${this.quality} of 5` : '';
    return `Slept ${this.duration}, from ${this.times.replace(' – ', ' to ')}${q}`;
  }

  // ---- dragging and keyboard (editable only) ----

  /** Keep drags on a handle from reaching the sheet's swipe-to-close gesture. */
  stop(ev: Event) {
    if (this.editable) ev.stopPropagation();
  }

  down(h: Handle, ev: PointerEvent) {
    if (!this.editable) return;
    ev.stopPropagation();
    this.dragging = h;
    this.lastBucket = -1;
    (ev.currentTarget as Element).setPointerCapture(ev.pointerId);
    ev.preventDefault();
  }

  move(ev: PointerEvent) {
    if (!this.dragging) return;
    const svg = (ev.currentTarget as SVGGElement).ownerSVGElement!;
    const rect = svg.getBoundingClientRect();
    const dx = ev.clientX - (rect.left + rect.width / 2);
    const dy = ev.clientY - (rect.top + rect.height / 2);
    const deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
    const raw = ((deg + 360) % 360) / 360 * 1440;
    const snapped = (Math.round(raw / SNAP) * SNAP) % 1440;
    this.set(this.dragging, snapped);
    // One tick per 15-minute boundary crossed.
    const bucket = Math.floor(snapped / 15);
    if (bucket !== this.lastBucket) {
      if (this.lastBucket !== -1) void hapticTick();
      this.lastBucket = bucket;
    }
  }

  up() { this.dragging = undefined; }

  key(h: Handle, ev: KeyboardEvent) {
    const step = { ArrowRight: SNAP, ArrowUp: SNAP, ArrowLeft: -SNAP, ArrowDown: -SNAP, PageUp: 60, PageDown: -60 }[ev.key];
    if (!step) return;
    ev.preventDefault();
    const cur = h === 'bed' ? this.bedMin : this.wakeMin;
    this.set(h, (((cur + step) % 1440) + 1440) % 1440);
  }

  private set(h: Handle, min: number) {
    if (h === 'bed') { if (min !== this.bedMin) this.bedMinChange.emit(min); }
    else if (min !== this.wakeMin) this.wakeMinChange.emit(min);
  }
}
