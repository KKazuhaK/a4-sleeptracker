import { Component, HostListener, OnDestroy, inject } from '@angular/core';
import { addIcons } from 'ionicons';
import { moonOutline, speedometerOutline, trashOutline } from 'ionicons/icons';
import {
  IonContent, IonHeader, IonIcon, IonItem, IonItemOption, IonItemOptions, IonItemSliding, IonLabel, IonList,
  IonSegment, IonSegmentButton, IonTitle, IonToolbar,
} from '@ionic/angular/standalone';
import { Subscription } from 'rxjs';
import { OvernightSleepData } from '../data/overnight-sleep-data';
import { SleepData } from '../data/sleep-data';
import { StanfordSleepinessData } from '../data/stanford-sleepiness-data';
import { SleepService } from '../services/sleep.service';
import { DayGroup, formatDuration, formatDurationShort, formatTime, groupByDay } from '../shared/format';
import { LogSheetService } from '../shared/log-sheet.service';
import { TierPillComponent } from '../shared/tier-pill.component';
import { ToastService } from '../shared/toast.service';

type Filter = 'all' | 'sleep' | 'sleepiness';

@Component({
  selector: 'app-history',
  templateUrl: 'history.page.html',
  styleUrls: ['history.page.scss'],
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonSegment, IonSegmentButton, IonLabel, IonList, IonItem,
    IonItemSliding, IonItemOptions, IonItemOption, IonIcon, TierPillComponent,
  ],
})
export class HistoryPage implements OnDestroy {
  private readonly sleep = inject(SleepService);
  private readonly sheets = inject(LogSheetService);
  private readonly toast = inject(ToastService);
  private readonly sub: Subscription;

  filter: Filter = 'all';
  groups: DayGroup[] = [];
  private readonly deleting = new Set<string>();

  readonly formatTime = formatTime;
  readonly formatDuration = formatDuration;
  readonly formatDurationShort = formatDurationShort;

  constructor() {
    addIcons({ trashOutline, moonOutline, speedometerOutline });
    this.sub = this.sheets.saved$.subscribe(() => this.refresh());
  }

  ionViewWillEnter() { this.refresh(); }

  /** Re-group (day headings) when the app returns to the foreground. */
  @HostListener('document:visibilitychange')
  onVisible() {
    if (document.visibilityState === 'visible') this.refresh();
  }
  ngOnDestroy() { this.sub.unsubscribe(); }

  refresh() {
    const records: SleepData[] =
      this.filter === 'sleep' ? this.sleep.getOvernight()
      : this.filter === 'sleepiness' ? this.sleep.getSleepiness()
      : this.sleep.getAll();
    this.groups = groupByDay(records);
  }

  setFilter(ev: CustomEvent) {
    this.filter = ev.detail.value as Filter;
    this.refresh();
  }

  get emptyText() {
    return {
      all: 'No records yet — log your sleep or sleepiness from the Today tab',
      sleep: 'No sleep logged yet — tap Log sleep on the Today tab',
      sleepiness: 'No sleepiness logged yet — tap Log sleepiness on the Today tab',
    }[this.filter];
  }

  asSleep(r: SleepData) { return r instanceof OvernightSleepData ? r : null; }
  asSleepiness(r: SleepData) { return r instanceof StanfordSleepinessData ? r : null; }

  async edit(r: SleepData) {
    try {
      if (r instanceof OvernightSleepData) await this.sheets.openSleep(r);
      else if (r instanceof StanfordSleepinessData) await this.sheets.openSleepiness(r);
    } catch (e) {
      await this.toast.error(e, 'Could not open the editor');
    }
  }

  async remove(r: SleepData, sliding: IonItemSliding) {
    // Ignore a second tap while this delete is in flight.
    if (this.deleting.has(r.id)) return;
    this.deleting.add(r.id);
    try {
      await sliding.close();
      const deleted = await this.sleep.delete(r.id);
      this.sheets.notifyChanged();
      await this.toast.undoable('Deleted', async () => {
        await this.sleep.restore(deleted);
        // Tell every page (Today too), not just this one.
        this.sheets.notifyChanged();
      });
    } catch (e) {
      this.refresh();
      await this.toast.error(e, 'Could not delete');
    } finally {
      this.deleting.delete(r.id);
    }
  }
}
