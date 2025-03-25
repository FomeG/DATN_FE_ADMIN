import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RevenueByTimeComponent } from './revenue-by-time.component';

describe('RevenueByTimeComponent', () => {
  let component: RevenueByTimeComponent;
  let fixture: ComponentFixture<RevenueByTimeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RevenueByTimeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RevenueByTimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
