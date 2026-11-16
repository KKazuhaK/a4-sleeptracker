import { Inject, Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Subject } from 'rxjs';
import { SleepData } from '../data/sleep-data';
import { OvernightSleepData } from '../data/overnight-sleep-data';
import { StanfordSleepinessData } from '../data/stanford-sleepiness-data';

const DATA_KEY = 'sleep-tracker-data';
const NOTIFICATION_SETTINGS_KEY = 'sleep-tracker-notifications';
// Reserve stable IDs so each settings save can replace the app's scheduled reminders.
const NOTIFICATION_IDS = [81000, 81001, 81002, 81003];

/** Record type sent to the UI when a user opens a sleep-tracker notification. */
export type SleepNotificationType = 'sleep' | 'sleepiness';

/** User-configurable local reminder schedule persisted on the device. */
export interface SleepNotificationSettings {
	sleepinessEnabled: boolean;
	sleepinessTimes: string[];
	sleepReminderEnabled: boolean;
	sleepReminderTime: string;
}

interface StoredSleepData {
	id: string;
	kind: 'overnight' | 'sleepiness';
	loggedAt: string;
	sleepStart?: string;
	sleepEnd?: string;
	quality?: number;
	loggedValue?: number;
	note?: string;
}

// Reminders are off by default until the user explicitly enables them in Settings.
const DEFAULT_NOTIFICATION_SETTINGS: SleepNotificationSettings = {
	sleepinessEnabled: false,
	sleepinessTimes: ['10:00', '14:00', '18:00'],
	sleepReminderEnabled: false,
	sleepReminderTime: '08:00',
};

@Injectable({
	providedIn: 'root'
})
export class SleepService {
	// Keep the original static collections in sync for existing screens while callers migrate.
	public static AllSleepData: SleepData[] = [];
	public static AllOvernightData: OvernightSleepData[] = [];
	public static AllSleepinessData: StanfordSleepinessData[] = [];

	private records: SleepData[] = [];
	private mutationQueue: Promise<void> = Promise.resolve();
	private storageReady?: Promise<Pick<Storage, 'get' | 'set'>>;
	private initPromise?: Promise<void>;
	private notificationSettings: SleepNotificationSettings = structuredClone(DEFAULT_NOTIFICATION_SETTINGS);
	private readonly notificationActionSubject = new Subject<SleepNotificationType>();
	readonly notificationAction$ = this.notificationActionSubject.asObservable();

	constructor(@Inject(Storage) private readonly storage: Pick<Storage, 'create'>) {}

	/** Load saved records/settings once; app initialization awaits this before showing screens. */
	init(): Promise<void> {
		this.initPromise ??= this.loadFromStorage();
		return this.initPromise;
	}

	getOvernight(): OvernightSleepData[] {
		return this.records
			.filter((record): record is OvernightSleepData => record instanceof OvernightSleepData)
			.sort((a, b) => b.loggedAt.getTime() - a.loggedAt.getTime());
	}

	getSleepiness(): StanfordSleepinessData[] {
		return this.records
			.filter((record): record is StanfordSleepinessData => record instanceof StanfordSleepinessData)
			.sort((a, b) => b.loggedAt.getTime() - a.loggedAt.getTime());
	}

	getAll(): SleepData[] {
		return [...this.records].sort((a, b) => b.loggedAt.getTime() - a.loggedAt.getTime());
	}

	getLastNight(): OvernightSleepData | undefined {
		return this.getOvernight()[0];
	}

	/** Create and persist a validated overnight-sleep record. */
	async logOvernight(
		start: Date,
		end: Date,
		extra: { quality?: number; note?: string } = {},
	): Promise<OvernightSleepData> {
		this.validateDate(start, 'Sleep start');
		this.validateDate(end, 'Sleep end');
		const record = new OvernightSleepData(start, end, extra.quality, extra.note);
		await this.addRecord(record);
		return record;
	}

	async logSleepiness(value: number, at: Date = new Date(), note?: string): Promise<StanfordSleepinessData> {
		this.validateSleepiness(value);
		this.validateDate(at, 'Sleepiness time');
		const record = new StanfordSleepinessData(value, at, note);
		await this.addRecord(record);
		return record;
	}

	async update(record: SleepData): Promise<void> {
		await this.ensureInitialized();
		await this.serializeMutation(async () => {
			const index = this.records.findIndex((entry) => entry.id === record.id);
			if (index === -1) {
				throw new Error(`Cannot update missing sleep record "${record.id}".`);
			}
			this.validateRecord(record);
			const updated = [...this.records];
			updated[index] = record;
			await this.persist(updated);
			this.records = updated;
			this.refreshLegacyCollections();
		});
	}

	async delete(id: string): Promise<SleepData> {
		await this.ensureInitialized();
		return this.serializeMutation(async () => {
			const index = this.records.findIndex((record) => record.id === id);
			if (index === -1) {
				throw new Error(`Cannot delete missing sleep record "${id}".`);
			}
			const deleted = this.records[index];
			const updated = this.records.filter((record) => record.id !== id);
			await this.persist(updated);
			this.records = updated;
			this.refreshLegacyCollections();
			return deleted;
		});
	}

	async restore(record: SleepData): Promise<void> {
		await this.ensureInitialized();
		await this.serializeMutation(async () => {
			if (this.records.some((entry) => entry.id === record.id)) {
				throw new Error(`Cannot restore sleep record "${record.id}" because it already exists.`);
			}
			this.validateRecord(record);
			const updated = [...this.records, record];
			await this.persist(updated);
			this.records = updated;
			this.refreshLegacyCollections();
		});
	}

	/** Average records logged within the requested trailing time window. */
	stats(days = 7): { avgSleepMinutes: number; avgSleepiness: number } {
		if (!Number.isFinite(days) || days <= 0) {
			throw new RangeError('The statistics period must be a positive number of days.');
		}
		const now = Date.now();
		const since = now - days * 24 * 60 * 60 * 1000;
		const inRange = this.records.filter((record) => {
			const loggedAt = record.loggedAt.getTime();
			return loggedAt >= since && loggedAt <= now;
		});
		const sleep = inRange.filter((record): record is OvernightSleepData => record instanceof OvernightSleepData);
		const sleepiness = inRange.filter((record): record is StanfordSleepinessData => record instanceof StanfordSleepinessData);
		return {
			avgSleepMinutes: this.average(sleep.map((record) => record.durationMinutes)),
			avgSleepiness: this.average(sleepiness.map((record) => record.loggedValue)),
		};
	}

	async clearAll(): Promise<void> {
		await this.ensureInitialized();
		await this.serializeMutation(async () => {
			await this.persist([]);
			this.records = [];
			this.refreshLegacyCollections();
		});
	}

	/** Populate an empty tracker with sample entries for demonstrations. */
	async loadDemoData(): Promise<void> {
		await this.ensureInitialized();
		await this.serializeMutation(async () => {
			if (this.records.length > 0) {
				throw new Error('Demo data can only be loaded when there are no saved records.');
			}
			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);
			const start = new Date(yesterday);
			start.setHours(23, 0, 0, 0);
			const end = new Date(start.getTime() + 8 * 60 * 60 * 1000);
			const demoRecords = [
				new OvernightSleepData(start, end, 4),
				new StanfordSleepinessData(3, new Date(end.getTime() + 5 * 60 * 60 * 1000)),
				new StanfordSleepinessData(5, new Date(end.getTime() + 9 * 60 * 60 * 1000)),
			];
			await this.persist(demoRecords);
			this.records = demoRecords;
			this.refreshLegacyCollections();
		});
	}

	async getNotificationSettings(): Promise<SleepNotificationSettings> {
		await this.ensureInitialized();
		return {
			...this.notificationSettings,
			sleepinessTimes: [...this.notificationSettings.sleepinessTimes],
		};
	}

	/** Validate settings, obtain permission if needed, then replace scheduled reminders. */
	async saveNotificationSettings(settings: SleepNotificationSettings): Promise<void> {
		await this.ensureInitialized();
		const normalized = this.validateNotificationSettings(settings);
		if (normalized.sleepinessEnabled || normalized.sleepReminderEnabled) {
			const permission = await LocalNotifications.checkPermissions();
			const granted = permission.display === 'granted'
				? permission
				: await LocalNotifications.requestPermissions();
			if (granted.display !== 'granted') {
				throw new Error('Notification permission was not granted.');
			}
		}
		await this.scheduleNotifications(normalized);
		await this.storageInstance().then((storage) => storage.set(NOTIFICATION_SETTINGS_KEY, normalized));
		this.notificationSettings = normalized;
	}

	private async loadFromStorage(): Promise<void> {
		const storage = await this.storageInstance();
		const stored = await storage.get(DATA_KEY) as StoredSleepData[] | null;
		this.records = stored === null ? [] : stored.map((item) => this.restoreStoredRecord(item));
		this.refreshLegacyCollections();

		const savedSettings = await storage.get(NOTIFICATION_SETTINGS_KEY) as SleepNotificationSettings | null;
		if (savedSettings !== null) {
			this.notificationSettings = this.validateNotificationSettings(savedSettings);
		}
		await this.listenForNotificationActions();
	}

	private async storageInstance(): Promise<Pick<Storage, 'get' | 'set'>> {
		this.storageReady ??= this.storage.create();
		return this.storageReady;
	}

	private async ensureInitialized(): Promise<void> {
		await this.init();
	}

	private async addRecord(record: SleepData): Promise<void> {
		await this.ensureInitialized();
		await this.serializeMutation(async () => {
			const updated = [...this.records, record];
			await this.persist(updated);
			this.records = updated;
			this.refreshLegacyCollections();
		});
	}

	private serializeMutation<T>(operation: () => Promise<T>): Promise<T> {
		// Serialize read-modify-write updates so concurrent actions cannot overwrite each other.
		const result = this.mutationQueue.then(operation);
		this.mutationQueue = result.then(() => undefined, () => undefined);
		return result;
	}

	private async persist(records: SleepData[] = this.records): Promise<void> {
		// Store plain objects with ISO dates instead of class instances that storage cannot revive.
		const stored: StoredSleepData[] = records.map((record) => {
			if (record instanceof OvernightSleepData) {
				return {
					id: record.id,
					kind: 'overnight',
					loggedAt: record.loggedAt.toISOString(),
					sleepStart: record.sleepStart.toISOString(),
					sleepEnd: record.sleepEnd.toISOString(),
					quality: record.quality,
					note: record.note,
				};
			}
			if (record instanceof StanfordSleepinessData) {
				return {
					id: record.id,
					kind: 'sleepiness',
					loggedAt: record.loggedAt.toISOString(),
					loggedValue: record.loggedValue,
					note: record.note,
				};
			}
			throw new Error(`Cannot persist unsupported sleep record "${record.id}".`);
		});
		await this.storageInstance().then((storage) => storage.set(DATA_KEY, stored));
	}

	private restoreStoredRecord(item: StoredSleepData): SleepData {
		const loggedAt = this.parseDate(item.loggedAt, 'Saved record time');
		if (typeof item.id !== 'string' || item.id.length === 0) {
			throw new Error('A saved sleep record has an invalid ID.');
		}
		if (item.kind === 'overnight' && item.sleepStart && item.sleepEnd) {
			return new OvernightSleepData(
				this.parseDate(item.sleepStart, 'Saved sleep start'),
				this.parseDate(item.sleepEnd, 'Saved sleep end'),
				item.quality,
				item.note,
				item.id,
			);
		}
		if (item.kind === 'sleepiness' && typeof item.loggedValue === 'number') {
			this.validateSleepiness(item.loggedValue);
			return new StanfordSleepinessData(item.loggedValue, loggedAt, item.note, item.id);
		}
		throw new Error(`Saved sleep record "${item.id}" has an invalid type or shape.`);
	}

	private validateRecord(record: SleepData): void {
		this.validateDate(record.loggedAt, 'Record time');
		if (record instanceof OvernightSleepData) {
			this.validateDate(record.sleepStart, 'Sleep start');
			this.validateDate(record.sleepEnd, 'Sleep end');
		} else if (record instanceof StanfordSleepinessData) {
			this.validateSleepiness(record.loggedValue);
		} else {
			throw new Error('Unsupported sleep record type.');
		}
	}

	private validateSleepiness(value: number): void {
		if (!Number.isInteger(value) || value < 1 || value > 7) {
			throw new RangeError('Sleepiness must be an integer from 1 to 7.');
		}
	}

	private validateDate(value: Date, label: string): void {
		if (!(value instanceof Date) || !Number.isFinite(value.getTime())) {
			throw new TypeError(`${label} must be a valid date.`);
		}
	}

	private parseDate(value: string, label: string): Date {
		const date = new Date(value);
		this.validateDate(date, label);
		return date;
	}

	private average(values: number[]): number {
		return values.length === 0 ? 0 : values.reduce((total, value) => total + value, 0) / values.length;
	}

	private refreshLegacyCollections(): void {
		SleepService.AllSleepData = this.getAll();
		SleepService.AllOvernightData = this.getOvernight();
		SleepService.AllSleepinessData = this.getSleepiness();
	}

	private validateNotificationSettings(settings: SleepNotificationSettings): SleepNotificationSettings {
		if (typeof settings.sleepinessEnabled !== 'boolean'
			|| typeof settings.sleepReminderEnabled !== 'boolean'
			|| !Array.isArray(settings.sleepinessTimes)
			|| (settings.sleepinessEnabled && settings.sleepinessTimes.length === 0)
			|| settings.sleepinessTimes.length > NOTIFICATION_IDS.length - 1
			|| settings.sleepinessTimes.some((time) => !this.isValidTime(time))
			|| !this.isValidTime(settings.sleepReminderTime)) {
			throw new TypeError('Notification settings are invalid.');
		}
		return {
			sleepinessEnabled: settings.sleepinessEnabled,
			sleepinessTimes: [...settings.sleepinessTimes],
			sleepReminderEnabled: settings.sleepReminderEnabled,
			sleepReminderTime: settings.sleepReminderTime,
		};
	}

	private isValidTime(value: string): boolean {
		return /^\d{2}:\d{2}$/.test(value)
			&& Number(value.slice(0, 2)) <= 23
			&& Number(value.slice(3, 5)) <= 59;
	}

	private async scheduleNotifications(settings: SleepNotificationSettings): Promise<void> {
		// Cancel this app's fixed reminder IDs first to avoid duplicates after settings edits.
		await LocalNotifications.cancel({ notifications: NOTIFICATION_IDS.map((id) => ({ id })) });
		const notifications = [];
		if (settings.sleepinessEnabled) {
			settings.sleepinessTimes.forEach((time, index) => {
				const [hour, minute] = time.split(':').map(Number);
				notifications.push({
					id: NOTIFICATION_IDS[index],
					title: 'Log your sleepiness',
					body: 'Take a moment to record how alert you feel.',
					schedule: { on: { hour, minute }, allowWhileIdle: true },
					extra: { recordType: 'sleepiness' },
				});
			});
		}
		if (settings.sleepReminderEnabled) {
			const [hour, minute] = settings.sleepReminderTime.split(':').map(Number);
			notifications.push({
				id: NOTIFICATION_IDS[3],
				title: 'Log last night’s sleep',
				body: 'Record when you went to bed and woke up.',
				schedule: { on: { hour, minute }, allowWhileIdle: true },
				extra: { recordType: 'sleep' },
			});
		}
		if (notifications.length > 0) {
			await LocalNotifications.schedule({ notifications });
		}
	}

	private async listenForNotificationActions(): Promise<void> {
		// Publish only recognized record types so the UI can route to the matching log sheet.
		await LocalNotifications.addListener('localNotificationActionPerformed', ({ notification }) => {
			const recordType = notification.extra?.recordType;
			if (recordType === 'sleep' || recordType === 'sleepiness') {
				this.notificationActionSubject.next(recordType);
			}
		});
	}
}
