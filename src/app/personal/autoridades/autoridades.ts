// src/app/personal/autoridades/autoridades.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Autoridad {
  id: number;
  identificacion: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  correo: string;
  cargo: string;
  departamento: string;
}

@Component({
  selector: 'app-autoridades',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './autoridades.html',
  styleUrls: ['./autoridades.css'],
})
export class AutoridadesComponent implements OnInit {
  private readonly storageKey = 'autoridades_personal';

  autoridades: Autoridad[] = [
    {
      id: 1,
      identificacion: '001-0000000-1',
      nombres: 'Dra. Lesly Mejía',
      apellidos: '',
      telefono: '809-000-0000',
      correo: 'lesly@uasd.edu.do',
      cargo: 'Decana',
      departamento: 'Ciencias de la Educación',
    },
  ];

  filtro = '';
  mostrandoForm = false;
  editando: Autoridad | null = null;

  modelo: Autoridad = this.crearModeloVacio();

  // ---------- ciclo de vida ----------
  ngOnInit(): void {
    this.cargarAutoridades();
  }

  // ---------- helpers de modelo ----------
  private crearModeloVacio(): Autoridad {
    return {
      id: 0,
      identificacion: '',
      nombres: '',
      apellidos: '',
      telefono: '',
      correo: '',
      cargo: '',
      departamento: '',
    };
  }

  // ---------- persistencia ----------
  private cargarAutoridades(): void {
    const raw = localStorage.getItem(this.storageKey);
    if (raw) {
      this.autoridades = JSON.parse(raw);
    } else {
      // guardamos el registro por defecto para futuras cargas
      this.guardarAutoridades();
    }
  }

  private guardarAutoridades(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this.autoridades));
  }

  // ---------- vista ----------
  get listaFiltrada(): Autoridad[] {
    const f = this.filtro.trim().toLowerCase();
    if (!f) return this.autoridades;
    return this.autoridades.filter((a) =>
      `${a.identificacion} ${a.nombres} ${a.apellidos} ${a.cargo} ${a.departamento}`
        .toLowerCase()
        .includes(f)
    );
  }

  nuevaAutoridad() {
    this.editando = null;
    this.modelo = this.crearModeloVacio();
    this.mostrandoForm = true;
  }

  editarAutoridad(a: Autoridad) {
    this.editando = a;
    this.modelo = { ...a };
    this.mostrandoForm = true;
  }

  guardar() {
    if (!this.modelo.identificacion || !this.modelo.nombres) {
      alert('Identificación y Nombre son obligatorios.');
      return;
    }

    if (this.editando) {
      Object.assign(this.editando, this.modelo);
    } else {
      const nuevo: Autoridad = {
        ...this.modelo,
        id:
          (this.autoridades.length
            ? Math.max(...this.autoridades.map((x) => x.id))
            : 0) + 1,
      };
      this.autoridades.push(nuevo);
    }

    this.guardarAutoridades();        // ⬅️ persistimos cambios

    this.mostrandoForm = false;
    this.modelo = this.crearModeloVacio();
    this.editando = null;
  }

  cancelar() {
    this.mostrandoForm = false;
    this.editando = null;
  }
}
