import { SleepData } from './sleep-data';

export class OvernightSleepData extends SleepData {
	private _sleepStart:Date;
	private _sleepEnd:Date;
	quality?:number;

	constructor(
		sleepStart:Date = new Date(Date.now() - 8 * 60 * 60 * 1000),
		sleepEnd:Date = new Date(),
		quality?:number,
		note?:string,
		id?:string,
	) {
		super(sleepEnd, id);
		this._sleepStart = new Date(sleepStart);
		this._sleepEnd = new Date(sleepEnd);
		this.quality = quality;
		this.note = note;
	}

	get sleepStart():Date {
		return this._sleepStart;
	}

	set sleepStart(value:Date) {
		this._sleepStart = new Date(value);
	}

	get sleepEnd():Date {
		return this._sleepEnd;
	}

	set sleepEnd(value:Date) {
		this._sleepEnd = new Date(value);
		this.loggedAt = this._sleepEnd;
	}

	get durationMinutes():number {
		return Math.round((this._sleepEnd.getTime() - this._sleepStart.getTime()) / 60000);
	}

	override summaryString():string {
		return Math.floor(this.durationMinutes / 60) + " hours, " + this.durationMinutes % 60 + " minutes.";
	}

	override dateString():string {
		return "Night of " + this.sleepStart.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
	}
}
