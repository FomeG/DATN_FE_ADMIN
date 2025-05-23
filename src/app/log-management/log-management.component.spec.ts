import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogManagementComponent } from './log-management.component';

describe('LogManagementComponent', () => {
  let component: LogManagementComponent;
  let fixture: ComponentFixture<LogManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LogManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
