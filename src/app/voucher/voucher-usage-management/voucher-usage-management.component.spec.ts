import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VoucherUsageManagementComponent } from './voucher-usage-management.component';

describe('VoucherUsageManagementComponent', () => {
  let component: VoucherUsageManagementComponent;
  let fixture: ComponentFixture<VoucherUsageManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VoucherUsageManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VoucherUsageManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
