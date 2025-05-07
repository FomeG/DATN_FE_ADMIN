import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VoucherUiComponent } from './voucher-ui.component';

describe('VoucherUiComponent', () => {
  let component: VoucherUiComponent;
  let fixture: ComponentFixture<VoucherUiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VoucherUiComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VoucherUiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
