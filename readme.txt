--Readme document for Kazuha Mo, kazuhak@uci.edu, 32722706 and Wanke Hou, wankeh@uci.edu, 56389780--
A4 group number: 8 (A4 Group 8)

1. How many assignment points do you believe you completed (replace the *'s with your numbers)?

*/10
- */1 The ability to log overnight sleep
- */1 The ability to log sleepiness during the day
- */1 The ability to view these two categories of logged data
- */2 Either using a native device resource or backing up logged data
- */2 Following good principles of mobile design
- */2 Creating a compelling app
- */1 A readme and demo video which explains how these features were implemented and their design rationale

2. How long, in hours, did it take you to complete this assignment?



3. What online resources did you consult when completing this assignment? (list specific URLs)



4. What classmates or other individuals did you consult as part of this assignment? What did you discuss?



5. Is there anything special we need to know in order to run your code?

From `sleeptracker`, run `npm install` and `npm start` to launch the app in a browser. To run on iOS, use a Mac with Xcode, run `npx cap sync ios` and then `npx cap run ios`; local notifications require notification permission.

--Aim for no more than two sentences for each of the following questions.--


6. Did you design your app with a particular type of user in mind? If so, whom?



7. Did you design your app specifically for iOS or Android, or both?



8. How can a person log overnight sleep in your app? Why did you choose to support logging overnight sleep in this way?



9. How can a person log sleepiness during the day in your app? Why did you choose to support logging sleepiness in this way?



10. How can a person view the data they logged in your app? Why did you choose to support viewing logged data in this way?



11. Which feature choose--using a native device resource, backing up logged data, or both?

Both: the app stores records locally with Ionic Storage and uses native local notifications for sleep and daytime sleepiness reminders.

12. If you used a native device resource, what feature did you add? How does this feature change the app's experience for a user?

Local reminders prompt students to record sleepiness during the day and last night's sleep in the morning. Users can choose whether each reminder is enabled and set the reminder times.

13. If you backed up logged data, where does it back up to?

Sleep records are persisted on the device through Ionic Storage; they are not uploaded to a remote service.

14. How does your app implement or follow principles of good mobile design?

The data layer supports the design through reliable local persistence, editable record objects, statistics, and delete/restore operations for an undo interaction. Notification settings and scheduled reminders encourage regular logging without requiring users to remember every entry.