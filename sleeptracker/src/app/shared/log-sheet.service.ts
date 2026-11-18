import { Injectable, inject } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { Subject } from 'rxjs';
import { OvernightSleepData } from '../data/overnight-sleep-data';
import { StanfordSleepinessData } from '../data/stanford-sleepiness-data';
import { LogSleepSheet } from './log-sleep.sheet';
import { LogSleepinessSheet } from './log-sleepiness.sheet';

/** Opens the log sheets from anywhere (buttons, history edit, notification taps). */
@Injectable({ providedIn: 'root' })
export class LogSheetService {
  private readonly modalCtrl = inject(ModalController);
  private readonly changedSubject = new Subject<void>();
  private busy = false;
  /** Emits whenever records changed (sheet saved, delete, undo) so every page can refresh. */
  readonly saved$ = this.changedSubject.asObservable();

  notifyChanged() { this.changedSubject.next(); }

  openSleep(record?: OvernightSleepData): Promise<boolean> {
    return this.open(LogSleepSheet, { record });
  }

  openSleepiness(record?: StanfordSleepinessData): Promise<boolean> {
    return this.open(LogSleepinessSheet, { record });
  }

  private async open(component: unknown, props: object): Promise<boolean> {
    // Ignore taps while a sheet is opening or open; never discard the user's edits.
    if (this.busy) return false;
    this.busy = true;
    try {
      // Release focus from the trigger so the page behind isn't aria-hidden while focused.
      (document.activeElement as HTMLElement | null)?.blur();
      const modal = await this.modalCtrl.create({
        component: component as never,
        componentProps: props,
        // Standard iOS card: the app behind scales back.
        presentingElement: document.querySelector<HTMLElement>('ion-router-outlet') ?? undefined,
      });
      await modal.present();
      const { role } = await modal.onDidDismiss();
      const saved = role === 'saved';
      if (saved) this.notifyChanged();
      return saved;
    } finally {
      this.busy = false;
    }
  }
}
