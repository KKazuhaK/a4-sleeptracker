import { Component, NgZone, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Subscription } from 'rxjs';
import { LogSheetService } from './shared/log-sheet.service';
import { SleepService } from './services/sleep.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnDestroy {
  private readonly sub: Subscription;

  constructor() {
    const sleepService = inject(SleepService);
    const router = inject(Router);
    const sheets = inject(LogSheetService);
    const zone = inject(NgZone);
    // Notification tap: go to Today first, then open the matching sheet.
    // The plugin callback runs outside Angular, so re-enter the zone.
    this.sub = sleepService.notificationAction$.subscribe((type) => {
      zone.run(() => {
        (async () => {
          await router.navigateByUrl('/tabs/today');
          if (type === 'sleep') await sheets.openSleep();
          else await sheets.openSleepiness();
        })().catch((e) => console.error('Could not open log sheet from notification', e));
      });
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
