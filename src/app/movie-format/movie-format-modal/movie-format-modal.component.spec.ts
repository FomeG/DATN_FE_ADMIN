import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MovieFormatModalComponent } from './movie-format-modal.component';

describe('MovieFormatModalComponent', () => {
  let component: MovieFormatModalComponent;
  let fixture: ComponentFixture<MovieFormatModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MovieFormatModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MovieFormatModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
