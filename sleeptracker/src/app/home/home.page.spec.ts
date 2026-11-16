import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Storage } from '@ionic/storage-angular';

import { HomePage } from './home.page';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [{
        provide: Storage,
        // The page test does not need browser storage; provide the service's minimal storage contract.
        useValue: { create: () => Promise.resolve({ get: async () => null, set: async () => undefined }) },
      }],
    });
    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
