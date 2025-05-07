import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NggcComponent } from './nggc.component';

describe('NggcComponent', () => {
  let component: NggcComponent;
  let fixture: ComponentFixture<NggcComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NggcComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NggcComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
