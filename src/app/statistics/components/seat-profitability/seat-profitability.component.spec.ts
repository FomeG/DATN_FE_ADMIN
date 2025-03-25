import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeatProfitabilityComponent } from './seat-profitability.component';

describe('SeatProfitabilityComponent', () => {
  let component: SeatProfitabilityComponent;
  let fixture: ComponentFixture<SeatProfitabilityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeatProfitabilityComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeatProfitabilityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
