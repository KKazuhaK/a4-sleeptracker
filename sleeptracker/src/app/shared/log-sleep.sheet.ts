import { Component, Input, OnInit, inject } from '@angular/core';
import { addIcons } from 'ionicons';
import { calendarOutline, checkmark, close, warningOutline } from 'ionicons/icons';
import {
  IonButton, IonButtons, IonContent, IonDatetime, IonDatetimeButton, IonHeader, IonIcon, IonModal, IonTextarea,
  IonTitle, IonToolbar, ModalController,
} from '@ionic/angular/standalone';
import { OvernightSleepData } from '../data/overnight-sleep-data';
import { SleepService } from '../services/sleep.service';
import { floorToMinutes, formatDate, formatDurationShort, formatTime, toHHmm, timeToIso, toLocalIso } from './format';
import { hapticSuccess, hapticWarning } from './haptics';
import { minutesOfDay, nightOf, resolveNight, startOfDay } from './night';
import { SleepDialComponent } from './sleep-dial.component';
import { ToastService } from './toast.service';

type NightChoice = 'last' | 'before' | 'custom';

function daysAgo(n: number): Date {
  const d = startOfDay(new Date());
  d.setDate(d.getDate() - n);
  return d;
}

function hhmm(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}

@Component({
  selector: 'app-log-sleep-sheet',
  templateUrl: 'log-sleep.sheet.html',
  styleUrls: ['sheet.scss'],
  imports: [
    IonButton, IonButtons, IonContent, IonDatetime, IonDatetimeButton, IonHeader, IonIcon, IonModal, IonTextarea,
    IonTitle, IonToolbar, SleepDialComponent,
  ],
})
export class LogSleepSheet implements OnInit {
  /** When set, the sheet edits this record (it is never mutated). */
  @Input() record?: OvernightSleepData;

  private readonly modalCtrl = inject(ModalController);
  private readonly sleep = inject(SleepService);
  private readonly toast = inject(ToastService);

  /** The night is the date of the evening you went to bed. */
  nightDate = daysAgo(1);
  choice: NightChoice = 'last';
  pickingDate = false;
  bedMin = 23 * 60;
  wakeMin = 7 * 60;
  quality?: number;
  note = '';
  saving = false;
  readonly qualities = [1, 2, 3, 4, 5];
  readonly timeToIso = timeToIso;
  readonly hhmm = hhmm;

  constructor() {
    addIcons({ warningOutline, calendarOutline, close, checkmark });
  }

  ngOnInit() {
    if (this.record) {
      this.nightDate = nightOf(this.record.sleepStart, this.record.sleepEnd);
      this.bedMin = minutesOfDay(this.record.sleepStart);
      this.wakeMin = minutesOfDay(this.record.sleepEnd);
      this.quality = this.record.quality;
      this.note = this.record.note ?? '';
      this.choice = this.nightDate.getTime() === daysAgo(1).getTime() ? 'last'
        : this.nightDate.getTime() === daysAgo(2).getTime() ? 'before' : 'custom';
    } else {
      // Defaults 23:00 -> 07:00; if that wakes in the future, clamp wake to now (5-min steps).
      const r = resolveNight(this.nightDate, this.bedMin, this.wakeMin);
      if (r && r.end.getTime() > Date.now()) {
        this.wakeMin = minutesOfDay(floorToMinutes(new Date(), 5));
      }
    }
  }

  get range() { return resolveNight(this.nightDate, this.bedMin, this.wakeMin); }
  get future() { return !!this.range && this.range.end.getTime() > Date.now(); }
  get same() { return this.range === null; }
  get valid() { return !!this.range && !this.future; }
  get minutes() { return this.range ? Math.round((this.range.end.getTime() - this.range.start.getTime()) / 60000) : 0; }

  get summary(): string {
    const r = this.range;
    const day = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'short' });
    return r ? `${formatDurationShort(this.minutes)} · ${day(r.start)} ${formatTime(r.start)} → ${day(r.end)} ${formatTime(r.end)}` : '';
  }

  /** Local YYYY-MM-DD of the chosen night for the date picker. */
  get nightValue() { return toLocalIso(this.nightDate).slice(0, 10); }
  /** The night of today always wakes in the future, so the latest pickable night is yesterday. */
  readonly maxNight = toLocalIso(daysAgo(1)).slice(0, 10);

  /** Real elapsed time (DST-aware), for the dial centre. */
  get elapsed() { return this.range ? this.minutes : null; }

  get customLabel() { return this.choice === 'custom' ? formatDate(this.nightDate) : 'Pick date…'; }

  get lengthWarning(): string | null {
    if (!this.range) return null;
    if (this.minutes > 14 * 60) return 'That is more than 14 hours. Check the times.';
    if (this.minutes < 60) return 'That is less than 1 hour. Check the times.';
    return null;
  }

  /** Warn when another record is for the same night. */
  get duplicateWarning(): string | null {
    const clash = this.sleep.getOvernight().some(
      (r) => r.id !== this.record?.id && nightOf(r.sleepStart, r.sleepEnd).getTime() === this.nightDate.getTime(),
    );
    return clash ? 'This night is already logged. Saving adds another.' : null;
  }

  pickNight(c: 'last' | 'before') {
    this.choice = c;
    this.nightDate = daysAgo(c === 'last' ? 1 : 2);
  }

  /** Radio-group keyboard pattern: arrows move between the three chips. */
  onChipKey(ev: KeyboardEvent) {
    const delta = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[ev.key];
    if (!delta) return;
    ev.preventDefault();
    const order: NightChoice[] = ['last', 'before', 'custom'];
    const row = ev.currentTarget as HTMLElement;
    const buttons = Array.from(row.querySelectorAll('button'));
    const cur = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const next = Math.min(2, Math.max(0, (cur < 0 ? order.indexOf(this.choice) : cur) + delta));
    // The date chip is only focused here; Enter/Space opens its picker.
    if (order[next] !== 'custom') this.pickNight(order[next] as 'last' | 'before');
    buttons[next].focus();
  }
  chipTab(c: NightChoice) { return this.choice === c ? 0 : -1; }

  setCustomDate(ev: CustomEvent) {
    const [y, m, d] = String(ev.detail.value).slice(0, 10).split('-').map(Number);
    if (!y) return;
    this.nightDate = new Date(y, m - 1, d);
    this.choice = 'custom';
    this.pickingDate = false;
  }

  setBedMin(m: number) { this.bedMin = m; }
  setWakeMin(m: number) { this.wakeMin = m; }

  setBedTime(ev: CustomEvent) { this.fromPicker(ev, (m) => (this.bedMin = m)); }
  setWakeTime(ev: CustomEvent) { this.fromPicker(ev, (m) => (this.wakeMin = m)); }

  private fromPicker(ev: CustomEvent, apply: (m: number) => void) {
    const t = toHHmm(String(ev.detail.value));
    if (!t) return;
    apply(Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5)));
  }

  setQuality(q: number) { this.quality = this.quality === q ? undefined : q; }
  setNote(ev: CustomEvent) { this.note = String(ev.detail.value ?? ''); }
  cancel() { return this.modalCtrl.dismiss(null, 'cancel'); }

  async save() {
    if (this.saving) return;
    const r = this.range;
    if (!r || !this.valid) { await hapticWarning(); return; }
    this.saving = true;
    const note = this.note.trim() || undefined;
    try {
      if (this.record) {
        // Build a new instance with the same id; the service's records are live objects.
        await this.sleep.update(new OvernightSleepData(r.start, r.end, this.quality, note, this.record.id));
      } else {
        await this.sleep.logOvernight(r.start, r.end, { quality: this.quality, note });
      }
      await hapticSuccess();
      await this.modalCtrl.dismiss(null, 'saved');
    } catch (e) {
      await hapticWarning();
      await this.toast.error(e, 'Could not save sleep');
    } finally {
      this.saving = false;
    }
  }
}
