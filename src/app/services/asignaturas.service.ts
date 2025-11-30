// src/app/services/asignaturas.service.ts
import { Injectable } from '@angular/core';

export interface Asignatura {
  codigo: string;
  nombre: string;
  creditos: number;

  // Campos opcionales
  tipo?: string;   // Obligatoria, optativa, etc.
  area?: string;   // Componente de formación / área

  // Para planificación curricular (horas teóricas y prácticas)
  ht?: number;
  hp?: number;
}

@Injectable({
  providedIn: 'root',
})
export class AsignaturasService {
  private asignaturas: Asignatura[] = [];

  constructor() {
    const raw = localStorage.getItem('asignaturas');
    if (raw) {
      this.asignaturas = JSON.parse(raw);
    }
  }

  /** Guarda el arreglo actual en localStorage */
  private guardar(): void {
    localStorage.setItem('asignaturas', JSON.stringify(this.asignaturas));
  }

  /** Listar todas las asignaturas */
  listar(): Asignatura[] {
    return [...this.asignaturas];
  }

  /** Alta manual de una sola asignatura (pantalla Asignaturas) */
  agregarManual(asig: Asignatura): void {
    this.asignaturas.push({ ...asig });
    this.guardar();
  }

  /** Actualizar una asignatura buscándola por el código original */
  actualizar(codigoOriginal: string, asigActualizada: Asignatura): void {
    const idx = this.asignaturas.findIndex(
      (a) => a.codigo === codigoOriginal
    );
    if (idx !== -1) {
      this.asignaturas[idx] = { ...asigActualizada };
      this.guardar();
    }
  }

  /** Eliminar por código */
  eliminar(codigo: string): void {
    this.asignaturas = this.asignaturas.filter((a) => a.codigo !== codigo);
    this.guardar();
  }

  /**
   * Importar un lote desde Excel.
   * Esta función la llama AsignaturasComponent después de leer el archivo.
   */
  agregarDesdeExcel(importadas: Asignatura[]): void {
    for (const a of importadas) {
      const existe = this.asignaturas.some((x) => x.codigo === a.codigo);
      if (!existe) {
        this.asignaturas.push({ ...a });
      }
    }
    this.guardar();
  }
}
