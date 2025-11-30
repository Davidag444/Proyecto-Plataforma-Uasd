import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EducacionVirtual } from './educacion-virtual';

describe('EducacionVirtual', () => {
  let component: EducacionVirtual;
  let fixture: ComponentFixture<EducacionVirtual>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EducacionVirtual]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EducacionVirtual);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
