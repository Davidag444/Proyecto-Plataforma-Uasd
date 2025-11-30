import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Asignaturas } from './asignaturas';

describe('Asignaturas', () => {
  let component: Asignaturas;
  let fixture: ComponentFixture<Asignaturas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Asignaturas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Asignaturas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
