import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenreManagementComponent } from './genre-management.component';

describe('GenreManagementComponent', () => {
  let component: GenreManagementComponent;
  let fixture: ComponentFixture<GenreManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenreManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GenreManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
