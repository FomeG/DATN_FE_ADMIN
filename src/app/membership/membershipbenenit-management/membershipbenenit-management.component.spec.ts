import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MembershipbenenitManagementComponent } from './membershipbenenit-management.component';

describe('MembershipbenenitManagementComponent', () => {
  let component: MembershipbenenitManagementComponent;
  let fixture: ComponentFixture<MembershipbenenitManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MembershipbenenitManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MembershipbenenitManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
