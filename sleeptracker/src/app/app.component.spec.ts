import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { AppComponent } from './app.component';
import { SleepService } from './services/sleep.service';

describe('AppComponent', () => {
  it('should create the app', async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        provideIonicAngular(),
        // Stub the data layer so the test needs no storage or native plugins.
        { provide: SleepService, useValue: { notificationAction$: new Subject() } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
