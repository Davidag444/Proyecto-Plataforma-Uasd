import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Competencias } from './competencias';

describe('Competencias', () => {
  let component: Competencias;
  let fixture: ComponentFixture<Competencias>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Competencias]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Competencias);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
