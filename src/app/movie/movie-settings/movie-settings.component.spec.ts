import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MovieSettingsComponent } from './movie-settings.component';

describe('MovieSettingsComponent', () => {
  let component: MovieSettingsComponent;
  let fixture: ComponentFixture<MovieSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MovieSettingsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MovieSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
