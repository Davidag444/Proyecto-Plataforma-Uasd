import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Recintos } from './recintos';

describe('Recintos', () => {
  let component: Recintos;
  let fixture: ComponentFixture<Recintos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Recintos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Recintos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
