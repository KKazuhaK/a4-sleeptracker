/* from the Stanford Sleepiness Scale */
/* https://web.stanford.edu/~dement/sss.html */

import { SleepData } from './sleep-data';

export class StanfordSleepinessData extends SleepData {
	public static ScaleValues = [undefined,//Sleepiness scale starts at 1
	'Feeling active, vital, alert, or wide awake', //1
	'Functioning at high levels, but not at peak; able to concentrate', //2
	'Awake, but relaxed; responsive but not fully alert', //3
	'Somewhat foggy, let down', //4
	'Foggy; losing interest in remaining awake; slowed down', //5
	'Sleepy, woozy, fighting sleep; prefer to lie down', //6
	'No longer fighting sleep, sleep onset soon; having dream-like thoughts']; //7

	private _loggedValue:number;

	// Optional ID allows persisted entries to be reconstructed without changing identity.
	constructor(loggedValue:number = 1, loggedAt:Date = new Date(), note?:string, id?:string) {
		super(loggedAt, id);
		this._loggedValue = loggedValue;
		this.note = note;
	}

	get loggedValue():number {
		return this._loggedValue;
	}

	set loggedValue(value:number) {
		this._loggedValue = value;
	}

	override summaryString():string {
		return this.loggedValue + ": " + StanfordSleepinessData.ScaleValues[this.loggedValue];
	}
}
