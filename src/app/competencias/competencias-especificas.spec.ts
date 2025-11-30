import { TestBed } from '@angular/core/testing';

import { CompetenciasEspecificas } from './competencias-especificas';

describe('CompetenciasEspecificas', () => {
  let service: CompetenciasEspecificas;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CompetenciasEspecificas);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
