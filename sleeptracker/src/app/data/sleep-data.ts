import { nanoid } from 'nanoid';

export class SleepData {
	id:string;
	loggedAt:Date;
	note?:string;

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
