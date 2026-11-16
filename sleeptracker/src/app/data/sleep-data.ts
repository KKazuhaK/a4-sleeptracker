import { nanoid } from 'nanoid';

export class SleepData {
	id:string;
	loggedAt:Date;
	note?:string;

	// Accept an ID when reviving a stored record; new records still receive a unique ID.
	constructor(loggedAt:Date = new Date(), id?:string) {
		this.id = id ?? nanoid();
		this.loggedAt = loggedAt;
	}

	summaryString():string {
		return 'Unknown sleep data';
	}

	dateString():string {
		return this.loggedAt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
	}
}
