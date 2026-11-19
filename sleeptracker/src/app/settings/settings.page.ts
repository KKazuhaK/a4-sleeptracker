import { Component, OnDestroy, inject } from '@angular/core';
import { addIcons } from 'ionicons';
import {
  addOutline, closeCircleOutline, flaskOutline, moonOutline, notificationsOutline, trashOutline,
} from 'ionicons/icons';
import {
  IonAlert, IonButton, IonContent, IonDatetime, IonDatetimeButton, IonHeader, IonIcon,
  IonModal, IonTitle, IonToggle, IonToolbar,
} from '@ionic/angular/standalone';
import { Subscription } from 'rxjs';
import { SleepNotificationSettings, SleepService } from '../services/sleep.service';
import { LogSheetService } from '../shared/log-sheet.service';
import { timeToIso, toHHmm } from '../shared/format';
import { ToastService } from '../shared/toast.service';
import { generateDemoData } from '../shared/demo-data';

const MAX_TIMES = 3;

@Component({
  selector: 'app-settings',
  templateUrl: 'settings.page.html',
  styleUrls: ['settings.page.scss'],
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonToggle, IonButton, IonIcon, IonAlert,
    IonDatetime, IonDatetimeButton, IonModal,
  ],
})
export class SettingsPage implements OnDestroy {
  private readonly sleep = inject(SleepService);
  private readonly toast = inject(ToastService);
  private readonly sheets = inject(LogSheetService);
  private readonly sub: Subscription;

  /** What the controls show (latest requested). */
  settings?: SleepNotificationSettings;
  /** Last value that was actually saved; the UI reverts to this on failure. */
  private lastSaved?: SleepNotificationSettings;
  private pending?: SleepNotificationSettings;
  private saving = false;
  hasRecords = false;
  confirmOpen = false;
  readonly maxTimes = MAX_TIMES;
  readonly timeToIso = timeToIso;
  readonly alertButtons = [
    { text: 'Cancel', role: 'cancel' },
    { text: 'Delete all logs', role: 'destructive', handler: () => { this.deleteAll(); } },
  ];

  constructor() {
    addIcons({ addOutline, closeCircleOutline, flaskOutline, moonOutline, notificationsOutline, trashOutline });
    this.sub = this.sheets.saved$.subscribe(() => this.refreshRecords());
  }

  ionViewWillEnter() {
    this.refreshRecords();
    if (this.saving) return;
    this.sleep.getNotificationSettings().then(
      (s) => { this.settings = s; this.lastSaved = s; },
      (e) => this.toast.error(e, 'Could not load reminder settings'),
    );
  }
  ngOnDestroy() { this.sub.unsubscribe(); }

  refreshRecords() { this.hasRecords = this.sleep.getAll().length > 0; }

  /** Latest-wins: show the change now, save in order, and coalesce changes made during a save. */
  private request(next: SleepNotificationSettings) {
    this.settings = next;
    this.pending = next;
    return this.drain();
  }

  private async drain() {
    if (this.saving) return;
    this.saving = true;
    try {
      while (this.pending) {
        const next = this.pending;
        this.pending = undefined;
        try {
          await this.sleep.saveNotificationSettings(next);
          this.lastSaved = next;
        } catch (e) {
          // Drop queued changes and show what is really saved.
          this.pending = undefined;
          this.settings = this.lastSaved && this.copy(this.lastSaved);
          await this.toast.error(e, 'Could not save reminders');
        }
      }
    } finally {
      this.saving = false;
    }
  }

  private copy(s: SleepNotificationSettings): SleepNotificationSettings {
    return { ...s, sleepinessTimes: [...s.sleepinessTimes] };
  }

  toggleSleepiness(ev: CustomEvent) {
    const checked = !!ev.detail.checked;
    if (!this.settings || checked === this.settings.sleepinessEnabled) return;
    return this.request({ ...this.copy(this.settings), sleepinessEnabled: checked });
  }

  toggleSleepReminder(ev: CustomEvent) {
    const checked = !!ev.detail.checked;
    if (!this.settings || checked === this.settings.sleepReminderEnabled) return;
    return this.request({ ...this.copy(this.settings), sleepReminderEnabled: checked });
  }

  setSleepinessTime(i: number, ev: CustomEvent) {
    const value = toHHmm(String(ev.detail.value));
    if (!this.settings || !value || value === this.settings.sleepinessTimes[i]) return;
    const next = this.copy(this.settings);
    next.sleepinessTimes[i] = value;
    return this.request(next);
  }

  setSleepReminderTime(ev: CustomEvent) {
    const value = toHHmm(String(ev.detail.value));
    if (!this.settings || !value || value === this.settings.sleepReminderTime) return;
    return this.request({ ...this.copy(this.settings), sleepReminderTime: value });
  }

  addTime() {
    if (!this.settings) return;
    const next = this.copy(this.settings);
    next.sleepinessTimes.push('20:00');
    return this.request(next);
  }

  removeTime(i: number) {
    if (!this.settings) return;
    const next = this.copy(this.settings);
    next.sleepinessTimes.splice(i, 1);
    return this.request(next);
  }

  async loadDemo() {
    try {
      // Two weeks of sample data through the public API (only into an empty tracker).
      if (this.sleep.getAll().length > 0) {
        throw new Error('Demo data can only be loaded when there are no saved records.');
      }
      const demo = generateDemoData();
      for (const n of demo.nights) {
        await this.sleep.logOvernight(n.start, n.end, { quality: n.quality, note: n.note });
      }
      for (const s of demo.levels) {
        await this.sleep.logSleepiness(s.value, s.at, s.note);
      }
      this.refreshRecords();
      this.sheets.notifyChanged();
      await this.toast.show('Demo data loaded', 'success');
    } catch (e) {
      await this.toast.error(e, 'Could not load demo data');
    }
  }

  async deleteAll() {
    try {
      await this.sleep.clearAll();
      this.refreshRecords();
      await this.toast.show('All logs deleted');
    } catch (e) {
      await this.toast.error(e, 'Could not delete logs');
    }
  }
}
