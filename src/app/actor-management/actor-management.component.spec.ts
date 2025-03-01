import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActorManagementComponent } from './actor-management.component';

describe('ActorManagementComponent', () => {
  let component: ActorManagementComponent;
  let fixture: ComponentFixture<ActorManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActorManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActorManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
