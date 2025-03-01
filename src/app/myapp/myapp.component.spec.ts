import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyappComponent } from './myapp.component';

describe('MyappComponent', () => {
  let component: MyappComponent;
  let fixture: ComponentFixture<MyappComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyappComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyappComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
