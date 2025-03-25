import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RevenueByCinemaComponent } from './revenue-by-cinema.component';

describe('RevenueByCinemaComponent', () => {
  let component: RevenueByCinemaComponent;
  let fixture: ComponentFixture<RevenueByCinemaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RevenueByCinemaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RevenueByCinemaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
