import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeatOccupancyComponent } from './seat-occupancy.component';

describe('SeatOccupancyComponent', () => {
  let component: SeatOccupancyComponent;
  let fixture: ComponentFixture<SeatOccupancyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeatOccupancyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeatOccupancyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
