import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgeRatingTestComponent } from './age-rating-test.component';

describe('AgeRatingTestComponent', () => {
  let component: AgeRatingTestComponent;
  let fixture: ComponentFixture<AgeRatingTestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgeRatingTestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgeRatingTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
