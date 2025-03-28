import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceTypeManagementComponent } from './service-type-management.component';

describe('ServiceTypeManagementComponent', () => {
  let component: ServiceTypeManagementComponent;
  let fixture: ComponentFixture<ServiceTypeManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceTypeManagementComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ServiceTypeManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
