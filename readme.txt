--Readme document for Kazuha Mo, kazuhak@uci.edu, 32722706 and Wanke Hou, wankeh@uci.edu, 56389780--
A4 group number: 8 (A4 Group 8)

1. How many assignment points do you believe you completed (replace the *'s with your numbers)?

10/10
- 1/1 The ability to log overnight sleep
- 1/1 The ability to log sleepiness during the day
- 1/1 The ability to view these two categories of logged data
- 2/2 Either using a native device resource or backing up logged data
- 2/2 Following good principles of mobile design
- 2/2 Creating a compelling app
- 1/1 A readme and demo video which explains how these features were implemented and their design rationale


2. How long, in hours, did it take you to complete this assignment?

In total about 11 hours (including debugging and configuration Xcode).


3. What online resources did you consult when completing this assignment? (list specific URLs)

- Ionic Angular components (ion-modal, ion-datetime, ion-item-sliding, ion-alert,
  ion-toast, ion-segment, ion-tabs):
  https://ionicframework.com/docs/components
- Ionic theming and CSS variables:
  https://ionicframework.com/docs/theming/color-generator
  https://ionicframework.com/docs/theming/advanced
- Ionic Storage:
  https://github.com/ionic-team/ionic-storage
- Capacitor Local Notifications, Haptics and iOS setup:
  https://capacitorjs.com/docs/apis/local-notifications
  https://capacitorjs.com/docs/apis/haptics
  https://capacitorjs.com/docs/ios
- Angular docs for @if/@for:
  https://angular.dev/guide/templates/control-flow
- Apple Human Interface Guidelines:
  https://developer.apple.com/design/human-interface-guidelines/
- Apple, moving to the UIScene life cycle (required by Xcode 27):
  https://developer.apple.com/documentation/uikit/transitioning-to-the-uikit-scene-based-life-cycle
- Stanford Sleepiness Scale wording:
  https://web.stanford.edu/~dement/sss.html


4. What classmates or other individuals did you consult as part of this assignment? What did you discuss?

No classmates outside our pair. The two of us split the work (Kazuha: UI and
interaction design; Wanke: the data layer and native features), agreed on the
data service API between the two halves, and reviewed and tested each other's
changes.


5. Is there anything special we need to know in order to run your code?

To run the app in a browser:

    cd sleeptracker && npm install && npm start

To run on iOS, use a Mac with Xcode, then from sleeptracker:

    npx cap sync ios
    npx cap run ios

Local notifications require notification permission.

The demo video (demo.mp4) was recorded on the iOS simulator. Timestamps:

    0:06  Today with no sleep logged for last night
    0:09  Log sleep: choose the night, drag the dial, set quality and a note
    0:42  Today updates with the new night and the 7-day chart
    0:45  Log sleepiness on the Stanford scale, with a custom time
    0:57  History: edit entries, swipe to delete, Undo (1:15-1:21),
          filter by Sleep / Sleepiness
    1:30  Settings: turn on reminders and set a reminder time
    2:01  Local notification arrives; tapping it opens Log sleepiness
    2:12  App is closed and reopened; all logged data is still there
    2:27  Dark mode


--Aim for no more than two sentences for each of the following questions.--


6. Did you design your app with a particular type of user in mind? If so, whom?

College students, whose sleep is irregular (late weekday nights, sleeping in on
weekends, short nights before exams) and who will only log if it takes a few
seconds. Everything is tuned for that: one-tap logging from Today, reminders
during the day (10 AM, 2 PM, 6 PM by default), and a week view that makes the
weekday/weekend pattern obvious.


7. Did you design your app specifically for iOS or Android, or both?

We designed for iOS first: Ionic runs in iOS mode on every platform, and we
followed iOS conventions (large titles, a floating tab bar, card sheets with
swipe-to-dismiss, swipe-to-delete, wheel time pickers). The app still runs on
Android and in the browser, but iOS is what we tested and recorded on.


8. How can a person log overnight sleep in your app? Why did you choose to support logging overnight sleep in this way?

Tapping Log sleep opens a sheet with a 24-hour dial: the user picks which night
(Last night by default) and drags the bedtime and wake handles, or sets the two
times in wheel pickers, then optionally rates quality and adds a note. We chose
this over two date-and-time fields because overnight sleep crosses midnight: the
app infers the dates from the chosen night, the dial shows the duration at a
glance, impossible entries (future times, under 1 h or over 14 h) are blocked
with a clear message, and logging the same night twice shows a warning.


9. How can a person log sleepiness during the day in your app? Why did you choose to support logging sleepiness in this way?

Tapping Log sleepiness (or a reminder notification) opens a sheet showing the
Stanford 1–7 scale as one row of number buttons; picking a level shows its
Stanford wording underneath, and the user can adjust the time (Now by default)
and add a note, then taps Save. Showing all seven levels at once, with the
selected level's wording, keeps ratings consistent from day to day, and
defaulting to Now makes a typical entry two taps.


10. How can a person view the data they logged in your app? Why did you choose to support viewing logged data in this way?

Today shows last night on the dial with a comparison to the user's weekly
average, today's sleepiness, and a 7-day chart of sleep with average
sleepiness; History lists every entry grouped by day, filterable to All, Sleep
or Sleepiness, where tapping an entry edits it and swiping deletes it (with
Undo). We split it this way so the first screen answers "how am I doing this
week" at a glance, while the full record stays one tab away for review and
correction.


11. Which feature choose--using a native device resource, backing up logged data, or both?

Both: the app stores records locally with Ionic Storage and uses native local
notifications for sleep and daytime sleepiness reminders.


12. If you used a native device resource, what feature did you add? How does this feature change the app's experience for a user?

Local reminders prompt students to record sleepiness during the day and last
night's sleep in the morning. Users can choose whether each reminder is enabled
and set the reminder times.


13. If you backed up logged data, where does it back up to?

All overnight and sleepiness logs are backed up to Ionic Storage, which uses
IndexedDB on the device. Every new, edited or deleted record is saved
immediately, and all previously logged data appears again when the app is
reopened.


14. How does your app implement or follow principles of good mobile design?

- Useful initial view: Today opens straight to last night, today's sleepiness
  and the week chart, with both log buttons on the same screen (and a demo-data
  option in Settings for first-time users).
- Uh-oh button: every sheet can be cancelled or swiped away, any entry can be
  edited, and deleting an entry or clearing all logs shows an Undo toast or a
  confirmation alert.
- Error prevention: dates are inferred from the chosen night, times in the
  future and implausible durations are rejected before saving, and logging a
  night that already exists shows a warning.
- Platform conventions: iOS mode everywhere, large titles, a floating tab bar,
  card sheets, swipe actions, wheel pickers, haptics, light and dark themes,
  and custom global Ionic color variables with a consistent night-sky palette
  across components.
- The data layer supports the design through reliable local persistence,
  editable record objects, statistics, and delete/restore operations for an
  undo interaction. Notification settings and scheduled reminders encourage
  regular logging without requiring users to remember every entry.
