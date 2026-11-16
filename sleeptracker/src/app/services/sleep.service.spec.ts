import { TestBed } from '@angular/core/testing';
import { Storage } from '@ionic/storage-angular';
import { LocalNotifications } from '@capacitor/local-notifications';
import { OvernightSleepData } from '../data/overnight-sleep-data';
import { StanfordSleepinessData } from '../data/stanford-sleepiness-data';
import { SleepService } from './sleep.service';

describe('SleepService', () => {
	let service: SleepService;
	const storedValues = new Map<string, unknown>();
	const storageInstance = {
		get: async (key: string) => storedValues.get(key) ?? null,
		set: async (key: string, value: unknown) => {
			storedValues.set(key, value);
			return value;
		},
	};
	const storageMock = {
		create: jasmine.createSpy().and.resolveTo(storageInstance),
	};

	beforeEach(async () => {
		storedValues.clear();
		TestBed.configureTestingModule({
			providers: [{ provide: Storage, useValue: storageMock }],
		});
		spyOn(LocalNotifications, 'addListener').and.resolveTo({ remove: async () => undefined });
		service = TestBed.inject(SleepService);
		await service.init();
	});

	afterEach(() => {
		TestBed.resetTestingModule();
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	it('persists records and restores date fields and record types', async () => {
		const start = new Date('2026-11-15T23:00:00');
		const end = new Date('2026-11-16T07:00:00');
		const overnight = await service.logOvernight(start, end, { quality: 4, note: 'Rested' });
		const sleepiness = await service.logSleepiness(5, new Date('2026-11-16T14:00:00'));

		const restoredService = new SleepService(storageMock);
		await restoredService.init();
		const restoredOvernight = restoredService.getOvernight()[0];
		const restoredSleepiness = restoredService.getSleepiness()[0];

		expect(restoredOvernight).toEqual(jasmine.any(OvernightSleepData));
		expect(restoredOvernight.id).toBe(overnight.id);
		expect(restoredOvernight.sleepStart).toEqual(start);
		expect(restoredOvernight.sleepEnd).toEqual(end);
		expect(restoredOvernight.quality).toBe(4);
		expect(restoredOvernight.note).toBe('Rested');
		expect(restoredSleepiness).toEqual(jasmine.any(StanfordSleepinessData));
		expect(restoredSleepiness.id).toBe(sleepiness.id);
		expect(restoredSleepiness.loggedAt).toEqual(new Date('2026-11-16T14:00:00'));
	});

	it('calculates averages and supports deleting and restoring records', async () => {
		const start = new Date(Date.now() - 9 * 60 * 60 * 1000);
		const end = new Date(Date.now() - 1 * 60 * 60 * 1000);
		const overnight = await service.logOvernight(start, end);
		await service.logSleepiness(3);
		await service.logSleepiness(5);

		expect(service.stats()).toEqual({ avgSleepMinutes: 480, avgSleepiness: 4 });

		const deleted = await service.delete(overnight.id);
		expect(deleted).toBe(overnight);
		expect(service.getOvernight().length).toBe(0);
		await service.restore(deleted);
		expect(service.getOvernight().length).toBe(1);
	});

	it('does not lose records when writes happen concurrently', async () => {
		await Promise.all([
			service.logSleepiness(2),
			service.logSleepiness(4),
			service.logSleepiness(6),
		]);

		expect(service.getSleepiness().length).toBe(3);
		expect((storedValues.get('sleep-tracker-data') as unknown[]).length).toBe(3);
	});

	it('rejects invalid sleepiness values', async () => {
		await expectAsync(service.logSleepiness(8)).toBeRejectedWithError(RangeError);
	});
});
