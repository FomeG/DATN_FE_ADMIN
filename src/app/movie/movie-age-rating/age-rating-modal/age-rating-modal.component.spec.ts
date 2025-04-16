import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgeRatingModalComponent } from './age-rating-modal.component';

describe('AgeRatingModalComponent', () => {
  let component: AgeRatingModalComponent;
  let fixture: ComponentFixture<AgeRatingModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgeRatingModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgeRatingModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
