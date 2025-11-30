// src/app/services/organizacion.service.ts
import { Injectable } from '@angular/core';

export interface Recinto {
  id: number;
  nombre: string;
  sigla: string;
  domicilioLegal: string;
  telefono: string;
  correo: string;
  archivosDescripcion?: string; // texto libre que simula la pestaña de archivos
}

export interface Departamento {
  id: number;
  nombre: string;
  telefono: string;
  correo: string;
  areaConocimiento: string;
}

@Injectable({
  providedIn: 'root',
})
export class OrganizacionService {
  private readonly RECINTOS_KEY = 'org-recintos';
  private readonly DEPARTAMENTOS_KEY = 'org-departamentos';

  private recintos: Recinto[] = [];
  private departamentos: Departamento[] = [];

  constructor() {
    this.cargar();
  }

  // ---------- carga / guardado localStorage ----------
  private cargar() {
    try {
      const rawR = localStorage.getItem(this.RECINTOS_KEY);
      this.recintos = rawR ? (JSON.parse(rawR) as Recinto[]) : [];
    } catch {
      this.recintos = [];
    }

    try {
      const rawD = localStorage.getItem(this.DEPARTAMENTOS_KEY);
      this.departamentos = rawD ? (JSON.parse(rawD) as Departamento[]) : [];
    } catch {
      this.departamentos = [];
    }
  }

  private guardarRecintos() {
    localStorage.setItem(this.RECINTOS_KEY, JSON.stringify(this.recintos));
  }

  private guardarDepartamentos() {
    localStorage.setItem(
      this.DEPARTAMENTOS_KEY,
      JSON.stringify(this.departamentos)
    );
  }

  // ---------- RECINTOS ----------
  getRecintos(): Recinto[] {
    return [...this.recintos];
  }

  saveRecinto(recinto: Recinto) {
    if (!recinto.id) {
      const nuevoId =
        this.recintos.length > 0
          ? Math.max(...this.recintos.map((r) => r.id)) + 1
          : 1;
      recinto.id = nuevoId;
      this.recintos.push({ ...recinto });
    } else {
      const idx = this.recintos.findIndex((r) => r.id === recinto.id);
      if (idx !== -1) {
        this.recintos[idx] = { ...recinto };
      } else {
        this.recintos.push({ ...recinto });
      }
    }
    this.guardarRecintos();
  }

  deleteRecinto(id: number) {
    this.recintos = this.recintos.filter((r) => r.id !== id);
    this.guardarRecintos();
  }

  // ---------- DEPARTAMENTOS ----------
  getDepartamentos(): Departamento[] {
    return [...this.departamentos];
  }

  saveDepartamento(dep: Departamento) {
    if (!dep.id) {
      const nuevoId =
        this.departamentos.length > 0
          ? Math.max(...this.departamentos.map((d) => d.id)) + 1
          : 1;
      dep.id = nuevoId;
      this.departamentos.push({ ...dep });
    } else {
      const idx = this.departamentos.findIndex((d) => d.id === dep.id);
      if (idx !== -1) {
        this.departamentos[idx] = { ...dep };
      } else {
        this.departamentos.push({ ...dep });
      }
    }
    this.guardarDepartamentos();
  }

  deleteDepartamento(id: number) {
    this.departamentos = this.departamentos.filter((d) => d.id !== id);
    this.guardarDepartamentos();
  }
}
