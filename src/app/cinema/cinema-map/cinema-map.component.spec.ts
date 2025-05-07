import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CinemaMapComponent } from './cinema-map.component';

describe('CinemaMapComponent', () => {
  let component: CinemaMapComponent;
  let fixture: ComponentFixture<CinemaMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CinemaMapComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CinemaMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
