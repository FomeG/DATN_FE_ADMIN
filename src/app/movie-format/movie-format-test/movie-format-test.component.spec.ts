import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MovieFormatTestComponent } from './movie-format-test.component';

describe('MovieFormatTestComponent', () => {
  let component: MovieFormatTestComponent;
  let fixture: ComponentFixture<MovieFormatTestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MovieFormatTestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MovieFormatTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
