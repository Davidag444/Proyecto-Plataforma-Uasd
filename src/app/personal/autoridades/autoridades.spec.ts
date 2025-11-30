import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Autoridades } from './autoridades';

describe('Autoridades', () => {
  let component: Autoridades;
  let fixture: ComponentFixture<Autoridades>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Autoridades]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Autoridades);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
