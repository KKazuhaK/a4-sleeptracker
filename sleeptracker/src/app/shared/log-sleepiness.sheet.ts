import { Component, Input, OnInit, inject } from '@angular/core';
import {
  IonButton, IonButtons, IonContent, IonDatetime, IonHeader, IonIcon, IonModal, IonTextarea, IonTitle, IonToolbar, ModalController,
} from '@ionic/angular/standalone';
import { StanfordSleepinessData } from '../data/stanford-sleepiness-data';
import { SleepService } from '../services/sleep.service';
import { formatDate, formatTime, isSameDay, sleepinessTier, tierLabel, timeToIso, toHHmm, toLocalIso } from './format';
import { ToastService } from './toast.service';
import { hapticSuccess, hapticWarning } from './haptics';
import { addIcons } from 'ionicons';
import { checkmark, close } from 'ionicons/icons';

addIcons({ close, checkmark });

@Component({
  selector: 'app-log-sleepiness-sheet',
  templateUrl: 'log-sleepiness.sheet.html',
  styleUrls: ['sheet.scss'],
  imports: [IonButton, IonButtons, IonContent, IonDatetime, IonHeader, IonIcon, IonModal, IonTextarea, IonTitle, IonToolbar],
})
export class LogSleepinessSheet implements OnInit {
  /** When set, the sheet edits this record (it is never mutated). */
  @Input() record?: StanfordSleepinessData;

  private readonly modalCtrl = inject(ModalController);
  private readonly sleep = inject(SleepService);
  private readonly toast = inject(ToastService);

  readonly scale = [1, 2, 3, 4, 5, 6, 7].map((v) => ({ value: v, text: StanfordSleepinessData.ScaleValues[v] as string }));
  value?: number;
  at = toLocalIso(new Date());
  pickingTime = false;
  readonly timeToIso = timeToIso;
  /** False until the user edits the time; then we keep full-precision times. */
  private touched = false;
  note = '';
  saving = false;

  ngOnInit() {
    if (this.record) {
      this.value = this.record.loggedValue;
      this.at = toLocalIso(this.record.loggedAt);
      this.note = this.record.note ?? '';
    }
  }

  tier = sleepinessTier;
  label = tierLabel;

  get selectedText() { return this.value ? StanfordSleepinessData.ScaleValues[this.value] : ''; }

  /** "Now" until the user changes it; edit mode shows the record's own time. */
  get timeText() {
    if (!this.touched && !this.record) return 'Now';
    const d = new Date(this.at);
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const day = isSameDay(d, new Date()) ? '' : isSameDay(d, y) ? 'Yesterday ' : `${formatDate(d)} `;
    return day + formatTime(d);
  }
  get timeValue() { return timeToIso(this.at.slice(11, 16)); }
  get canReset() { return this.touched; }

  setTime(ev: CustomEvent) {
    const t = toHHmm(String(ev.detail.value));
    this.pickingTime = false;
    if (!t) return;
    // Keep the original date (today for new entries); only the time of day changes.
    const d = this.record ? new Date(this.record.loggedAt) : new Date();
    d.setHours(Number(t.slice(0, 2)), Number(t.slice(3, 5)), 0, 0);
    // New entries: a time later than now means yesterday (e.g. 23:50 logged at 00:15).
    if (!this.record && d.getTime() > Date.now()) d.setDate(d.getDate() - 1);
    const iso = toLocalIso(d);
    if (iso === this.at && !this.touched) return;
    this.at = iso;
    this.touched = true;
  }

  /** Back to now (new entry) or the original time (edit). */
  reset() {
    this.touched = false;
    this.at = toLocalIso(this.record ? this.record.loggedAt : new Date());
  }

  // Radio-group keyboard pattern: arrows move the selection, only one radio is tabbable.
  tabIndexFor(v: number) { return (this.value ?? 1) === v ? 0 : -1; }
  onScaleKey(ev: KeyboardEvent) {
    const delta = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[ev.key];
    if (!delta) return;
    ev.preventDefault();
    const next = Math.min(7, Math.max(1, (this.value ?? (delta > 0 ? 0 : 8)) + delta));
    this.value = next;
    const row = ev.currentTarget as HTMLElement;
    (row.querySelectorAll('button')[next - 1] as HTMLElement).focus();
  }

  get future() { return this.touched && new Date(this.at).getTime() > Date.now(); }
  get valid() { return this.value !== undefined && Number.isFinite(new Date(this.at).getTime()) && !this.future; }

  setNote(ev: CustomEvent) { this.note = String(ev.detail.value ?? ''); }
  cancel() { return this.modalCtrl.dismiss(null, 'cancel'); }

  async save() {
    if (this.saving) return;
    if (!this.valid) { await hapticWarning(); return; }
    this.saving = true;
    // Untouched time: use the exact current time (new) or the original time (edit) so ordering stays precise.
    const at = this.touched ? new Date(this.at) : this.record ? this.record.loggedAt : new Date();
    const note = this.note.trim() || undefined;
    try {
      if (this.record) {
        // New instance with the same id; never mutate the service's live record.
        await this.sleep.update(new StanfordSleepinessData(this.value!, at, note, this.record.id));
      } else {
        await this.sleep.logSleepiness(this.value!, at, note);
      }
      await hapticSuccess();
      await this.modalCtrl.dismiss(null, 'saved');
    } catch (e) {
      await hapticWarning();
      await this.toast.error(e, 'Could not save sleepiness');
    } finally {
      this.saving = false;
    }
  }
}
