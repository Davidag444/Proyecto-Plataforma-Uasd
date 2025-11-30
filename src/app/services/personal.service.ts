// src/app/services/personal.service.ts
import { Injectable } from '@angular/core';
import {
  AsignaturasService,
  Asignatura,
} from './asignaturas.service';

export interface Profesor {
  id?: number;                  // id ahora es opcional
  tipoIdentificacion: string;   // Cédula, Pasaporte, etc.
  identificacion: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  correo: string;
  categoria: string;
  asignaturas: string[];        // códigos de las asignaturas que imparte
  especialidad: string;
}

@Injectable({
  providedIn: 'root',
})
export class PersonalService {
  private profesores: Profesor[] = [];

  // Listas base para generar nombres "fakes"
  private nombresBase = [
    'Juan',
    'María',
    'Luis',
    'Ana',
    'Carlos',
    'Laura',
    'Pedro',
    'Sofía',
    'Miguel',
    'Paola',
    'José',
    'Carolina',
  ];

  private apellidosBase = [
    'Pérez',
    'González',
    'Rodríguez',
    'Martínez',
    'López',
    'Ramírez',
    'Santos',
    'Fernández',
    'Almánzar',
    'Morales',
    'Castillo',
    'Reyes',
  ];

  private categoriasBase = ['Auxiliar', 'Asistente', 'Adjunto', 'Titular'];

  constructor(private asigSvc: AsignaturasService) {
    const raw = localStorage.getItem('profesores');
    if (raw) {
      this.profesores = JSON.parse(raw);
    } else {
      // Semilla inicial: un profesor por cada asignatura existente
      this.crearProfesoresInicialesPorMateria();
    }
  }

  // =====================
  // Persistencia interna
  // =====================
  private guardar(): void {
    localStorage.setItem('profesores', JSON.stringify(this.profesores));
  }

  private siguienteId(): number {
    if (!this.profesores.length) return 1;

    const ids = this.profesores
      .map((p) => p.id ?? 0)
      .filter((x) => x > 0);

    return ids.length ? Math.max(...ids) + 1 : 1;
  }

  // =====================
  // Semilla inicial
  // =====================
  private crearProfesoresInicialesPorMateria(): void {
    const asignaturas: Asignatura[] = this.asigSvc.listar();
    if (!asignaturas.length) {
      this.profesores = [];
      this.guardar();
      return;
    }

    let id = 1;
    this.profesores = asignaturas.map((a) =>
      this.generarProfesorFakeParaAsignatura(a, id++)
    );

    this.guardar();
  }

  /**
   * Genera un profesor "fake" para una asignatura concreta.
   * Se usa en la semilla y cuando se agregan nuevas asignaturas.
   */
  private generarProfesorFakeParaAsignatura(
    a: Asignatura,
    id: number
  ): Profesor {
    const idxNombre = (id - 1) % this.nombresBase.length;
    const idxApellido = (id - 1) % this.apellidosBase.length;
    const idxCategoria = (id - 1) % this.categoriasBase.length;

    const nombres = this.nombresBase[idxNombre];
    const apellidos = this.apellidosBase[idxApellido];
    const categoria = this.categoriasBase[idxCategoria];

    const idStr7 = id.toString().padStart(7, '0'); // 0000001
    const identificacion = `001-${idStr7}-${(id % 9) + 1}`; // 001-0000001-2

    const telStr4 = id.toString().padStart(4, '0'); // 0001
    const telefono = `809-555-${telStr4}`;

    const slug = (
      nombres.split(' ')[0] +
      '.' +
      apellidos.split(' ')[0]
    )
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z.]/g, '');

    const correo = `${slug}${id}@uasd.edu.do`;

    const profesor: Profesor = {
      id,
      tipoIdentificacion: 'Cédula',
      identificacion,
      nombres,
      apellidos,
      telefono,
      correo,
      categoria,
      asignaturas: [a.codigo], // un profesor por materia
      especialidad: a.nombre,
    };

    return profesor;
  }

  // =====================
  // API pública básica
  // =====================
  listar(): Profesor[] {
    return [...this.profesores];
  }

  obtener(id: number): Profesor | undefined {
    return this.profesores.find((p) => p.id === id);
  }

  /** Crear o actualizar un profesor desde formularios (Profesores). */
  upsert(prof: Profesor): Profesor {
    if (prof.id && this.profesores.some((p) => p.id === prof.id)) {
      const idx = this.profesores.findIndex((p) => p.id === prof.id);
      this.profesores[idx] = { ...prof };
    } else {
      const nuevoId = this.siguienteId();
      prof.id = nuevoId;
      this.profesores.push({ ...prof });
    }

    this.guardar();
    return prof;
  }

  /** Alias para ser compatible con profesores.ts */
  guardarProfesor(prof: Profesor): Profesor {
    return this.upsert(prof);
  }

  eliminarProfesor(id: number): void {
    this.profesores = this.profesores.filter((p) => p.id !== id);
    this.guardar();
  }

  // =====================
  // Enlace con Asignaturas
  // =====================

  /**
   * Crea (si no existe) un profesor para una asignatura recién creada.
   * Usado desde AsignaturasComponent.guardarNueva()
   */
  crearProfesorDesdeAsignatura(asig: Asignatura): void {
    if (!asig || !asig.codigo) return;

    const existente = this.profesores.find((p) =>
      p.asignaturas.includes(asig.codigo)
    );

    if (existente) {
      if (!existente.asignaturas.includes(asig.codigo)) {
        existente.asignaturas.push(asig.codigo);
        this.guardar();
      }
      return;
    }

    const nuevoId = this.siguienteId();
    const nuevo = this.generarProfesorFakeParaAsignatura(asig, nuevoId);
    this.profesores.push(nuevo);
    this.guardar();
  }

  /**
   * Crea profesores automáticos para un lote de asignaturas (importación Excel).
   */
  crearProfesoresDesdeAsignaturas(asignaturas: Asignatura[]): void {
    if (!asignaturas || !asignaturas.length) return;

    for (const a of asignaturas) {
      this.crearProfesorDesdeAsignatura(a);
    }
  }

  /**
   * Devuelve los profesores que imparten un código de asignatura.
   * Lo usan AsignaturasComponent y plan-create.ts
   */
  obtenerPorAsignatura(codigoAsignatura: string): Profesor[] {
    if (!codigoAsignatura) return [];
    return this.profesores.filter((p) =>
      p.asignaturas.includes(codigoAsignatura)
    );
  }

  /**
   * Alias con el nombre que está usando plan-create.ts
   * this.personalSvc.getProfesoresPorAsignatura(asig.codigo)
   */
  getProfesoresPorAsignatura(codigoAsignatura: string): Profesor[] {
    return this.obtenerPorAsignatura(codigoAsignatura);
  }
}
