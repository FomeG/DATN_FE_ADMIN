import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowtimeManagementComponent } from './showtime-management.component';

describe('ShowtimeManagementComponent', () => {
  let component: ShowtimeManagementComponent;
  let fixture: ComponentFixture<ShowtimeManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowtimeManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShowtimeManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
