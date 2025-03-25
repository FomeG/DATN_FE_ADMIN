import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BundledServicesComponent } from './bundled-services.component';

describe('BundledServicesComponent', () => {
  let component: BundledServicesComponent;
  let fixture: ComponentFixture<BundledServicesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BundledServicesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BundledServicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
