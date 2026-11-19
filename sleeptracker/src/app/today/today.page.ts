import { Component, HostListener, OnDestroy, inject } from '@angular/core';
import { addIcons } from 'ionicons';
import { bedOutline, pulseOutline } from 'ionicons/icons';
import { IonButton, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { SleepDialComponent } from '../shared/sleep-dial.component';
import { WeekChartComponent, WeekDay } from '../shared/week-chart.component';
import { Subscription } from 'rxjs';
import { OvernightSleepData } from '../data/overnight-sleep-data';
import { StanfordSleepinessData } from '../data/stanford-sleepiness-data';
import { SleepService } from '../services/sleep.service';
import { formatDate, formatDuration, formatTime, isSameDay, sleepinessTier, tierLabel } from '../shared/format';
import { LogSheetService } from '../shared/log-sheet.service';
import { TierPillComponent } from '../shared/tier-pill.component';

@Component({
  selector: 'app-today',
  templateUrl: 'today.page.html',
  styleUrls: ['today.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon, TierPillComponent, SleepDialComponent, WeekChartComponent],
})
export class TodayPage implements OnDestroy {
  private readonly sleep = inject(SleepService);
  private readonly sheets = inject(LogSheetService);
  private readonly sub: Subscription;

  /** Night shown in the card: only if it ended after noon yesterday (this morning's wake-up). */
  lastNight?: OvernightSleepData;
  /** Most recent night overall, mentioned when lastNight is stale. */
  mostRecent?: OvernightSleepData;
  /** Average of the other nights in the previous 7 days (0 = none). */
  avgMinutes = 0;
  todays: StanfordSleepinessData[] = [];
  week: WeekDay[] = [];

  readonly formatTime = formatTime;
  readonly formatDuration = formatDuration;
  readonly formatDate = formatDate;

  constructor() {
    addIcons({ bedOutline, pulseOutline });
    this.sub = this.sheets.saved$.subscribe(() => this.refresh());
  }

  ionViewWillEnter() { this.refresh(); }
  ngOnDestroy() { this.sub.unsubscribe(); }

  /** Re-render day-dependent content when the app returns to the foreground. */
  @HostListener('document:visibilitychange')
  onVisible() {
    if (document.visibilityState === 'visible') this.refresh();
  }

  refresh() {
    const now = new Date();
    const nights = this.sleep.getOvernight();
    this.mostRecent = nights[0];
    // "Last night" means a night that ended after noon yesterday (i.e. this morning's wake-up),
    // so yesterday morning's entry is not mistaken for last night.
    const yesterdayNoon = new Date(now);
    yesterdayNoon.setDate(yesterdayNoon.getDate() - 1);
    yesterdayNoon.setHours(12, 0, 0, 0);
    const recent = this.mostRecent && this.mostRecent.sleepEnd.getTime() > yesterdayNoon.getTime();
    this.lastNight = recent ? this.mostRecent : undefined;
    this.todays = this.sleep.getSleepiness().filter((r) => isSameDay(r.loggedAt, now));
    // Compare against the other nights, not the one being shown.
    const weekAgo = now.getTime() - 7 * 24 * 3600000;
    const others = nights.filter((n) => n !== this.lastNight && n.sleepEnd.getTime() >= weekAgo);
    this.avgMinutes = others.length
      ? others.reduce((sum, n) => sum + n.durationMinutes, 0) / others.length
      : 0;
    this.buildWeek(now);
  }

  /** One entry per day for the last 7 days (oldest first); a night counts on its wake date. */
  private buildWeek(now: Date) {
    const nights = this.sleep.getOvernight();
    const levels = this.sleep.getSleepiness();
    this.week = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(now);
      day.setDate(now.getDate() - (6 - i));
      // Longest night per wake date, so a duplicate entry doesn't double the bar.
      const sleepMin = Math.max(0, ...nights.filter((n) => isSameDay(n.sleepEnd, day)).map((n) => n.durationMinutes));
      const vals = levels.filter((r) => isSameDay(r.loggedAt, day)).map((r) => r.loggedValue);
      return {
        initial: day.toLocaleDateString('en-US', { weekday: 'narrow' }),
        name: day.toLocaleDateString('en-US', { weekday: 'long' }),
        minutes: sleepMin,
        sleepiness: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0,
        today: i === 6,
      };
    });
  }

  get latestTier() { return this.latest ? sleepinessTier(this.latest.loggedValue) : 'low'; }
  get latestLabel() { return this.latest ? tierLabel(this.latest.loggedValue) : ''; }

  get latest() { return this.todays[0]; }

  /** Short chip text: "+24 min vs your week". */
  get comparison(): string {
    if (!this.lastNight || this.avgMinutes <= 0) return '';
    const diff = Math.round(this.lastNight.durationMinutes - this.avgMinutes);
    if (Math.abs(diff) < 5) return 'About the same as your week';
    return `${diff > 0 ? '+' : '−'}${formatDuration(Math.abs(diff))} vs your week`;
  }

  logSleep() { return this.sheets.openSleep(); }
  logSleepiness() { return this.sheets.openSleepiness(); }
}
