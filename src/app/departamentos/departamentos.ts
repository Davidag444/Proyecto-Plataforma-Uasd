// src/app/departamentos/departamentos.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Departamento {
  id: number;
  nombre: string;
  telefono: string;
  correo: string;
  areaConocimiento: string;
}

@Component({
  selector: 'app-departamentos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './departamentos.html',
  styleUrls: ['./departamentos.css'],
})
export class DepartamentosComponent implements OnInit {
  private readonly STORAGE_KEY = 'departamentos_uasd';

  departamentos: Departamento[] = [];
  filtro = '';

  // === Modelo que te faltaba ===
  deptoActual: Departamento = this.crearModeloVacio();
  editando = false;
  mostrarForm = false;

  ngOnInit(): void {
    this.cargar();
  }

  // ----- helpers -----
  private crearModeloVacio(): Departamento {
    return {
      id: 0,
      nombre: '',
      telefono: '',
      correo: '',
      areaConocimiento: '',
    };
  }

  private cargar(): void {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    this.departamentos = raw ? (JSON.parse(raw) as Departamento[]) : [];
  }

  private guardarStorage(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.departamentos));
  }

  get departamentosFiltrados(): Departamento[] {
    const f = this.filtro.trim().toLowerCase();
    if (!f) return this.departamentos;

    return this.departamentos.filter((d) =>
      `${d.nombre} ${d.telefono} ${d.correo} ${d.areaConocimiento}`
        .toLowerCase()
        .includes(f)
    );
  }

  // ----- acciones -----
  nuevoDepartamento(): void {
    this.deptoActual = this.crearModeloVacio();
    this.editando = false;
    this.mostrarForm = true;
  }

  editarDepartamento(dep: Departamento): void {
    this.deptoActual = { ...dep };
    this.editando = true;
    this.mostrarForm = true;
  }

  cancelarForm(): void {
    this.mostrarForm = false;
    this.editando = false;
  }

  guardarDepartamento(): void {
    const d = this.deptoActual;

    if (!d.nombre.trim()) {
      alert('El nombre del departamento es obligatorio.');
      return;
    }

    if (this.editando) {
      const idx = this.departamentos.findIndex((x) => x.id === d.id);
      if (idx !== -1) {
        this.departamentos[idx] = { ...d };
      }
    } else {
      const nuevoId =
        this.departamentos.length > 0
          ? Math.max(...this.departamentos.map((x) => x.id)) + 1
          : 1;
      this.departamentos.push({ ...d, id: nuevoId });
    }

    this.guardarStorage();
    this.mostrarForm = false;
    this.editando = false;
  }

  eliminarDepartamento(dep: Departamento): void {
    if (
      !confirm(
        `¿Eliminar el departamento "${dep.nombre}" de la lista?`
      )
    ) {
      return;
    }

    this.departamentos = this.departamentos.filter((x) => x.id !== dep.id);
    this.guardarStorage();
  }
}
