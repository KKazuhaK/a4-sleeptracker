# Frontend data-layer quick guide

The data layer lives in `src/app/services/sleep.service.ts`. Inject `SleepService` into a page/component; it is a singleton, and the app loads saved records during startup.

## Reading records

These getters are synchronous and return newest-first arrays:

```ts
sleepService.getOvernight();   // OvernightSleepData[]
sleepService.getSleepiness();  // StanfordSleepinessData[]
sleepService.getAll();         // SleepData[] (both kinds)
sleepService.getLastNight();   // OvernightSleepData | undefined
sleepService.stats(7);         // { avgSleepMinutes: number; avgSleepiness: number }
```

`stats()` defaults to the last 7 days; an average is `0` when there are no records of that type. Records expose `id`, `loggedAt`, and optional `note`. Overnight records also expose `sleepStart`, `sleepEnd`, optional `quality`, and `durationMinutes`; sleepiness records expose `loggedValue` (1–7).

## Creating, editing, and deleting

All changes that write data return promises. Await them before showing success or closing a form:

```ts
const overnight = await sleepService.logOvernight(startDate, endDate, {
  quality: 4, // optional
  note: 'Woke up once', // optional
});

const sleepiness = await sleepService.logSleepiness(4, new Date(), 'A little tired'); // time and note optional
await sleepService.update(overnight); // pass the edited record with its original id

const deleted = await sleepService.delete(overnight.id); // keep this object for Undo
await sleepService.restore(deleted); // restores the deleted record
```

`delete()` returns the removed record for an Undo action. `update()` and `restore()` reject invalid operations; logging also rejects invalid dates or sleepiness values outside 1–7. Handle rejected promises and show an error instead of reporting success.

Other Settings actions:

```ts
await sleepService.clearAll(); // permanently remove all saved records
await sleepService.loadDemoData(); // only works when there are no saved records
```

## Notification settings and tap handling

Use the exported `SleepNotificationSettings` type. Reminders are disabled by default; default sleepiness times are `10:00`, `14:00`, and `18:00`, and the sleep reminder defaults to `08:00`.

```ts
const settings = await sleepService.getNotificationSettings();
await sleepService.saveNotificationSettings({
  sleepinessEnabled: true,
  sleepinessTimes: ['10:00', '14:00', '18:00'],
  sleepReminderEnabled: false,
  sleepReminderTime: '08:00',
});
```

Saving enabled reminders requests notification permission when needed and schedules/cancels the app's local reminders. Handle a permission or scheduling failure as an error.

Subscribe to `notificationAction$` (type: `'sleep' | 'sleepiness'`) to open the corresponding record sheet when a notification is tapped. For example, `'sleep'` should open the overnight-sleep form and `'sleepiness'` the sleepiness form. The page/router should own this UI navigation; the service only emits the requested record type.