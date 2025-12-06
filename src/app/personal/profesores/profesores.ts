// src/app/personal/profesores/profesores.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  AsignaturasService,
  Asignatura,
} from '../../services/asignaturas.service';

import {
  PersonalService,
  Profesor,
} from '../../services/personal.service';

// jsPDF global (incluido por <script> en index.html)
declare const jsPDF: any;

@Component({
  selector: 'app-profesores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profesores.html',
  styleUrls: ['./profesores.css'],
})
export class ProfesoresComponent implements OnInit {
  filtro = '';

  profesores: Profesor[] = [];
  asignaturas: Asignatura[] = [];

  seleccionado: Profesor | null = null;

  modelo: Profesor = this.crearModeloVacio();

  constructor(
    private personalSvc: PersonalService,
    private asigSvc: AsignaturasService
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  private cargarDatos(): void {
    // 1) Leemos todas las asignaturas que ya están en localStorage
    this.asignaturas = this.asigSvc.listar();

    // 2) Creamos profesores ficticios para cualquier asignatura que aún no tenga
    this.personalSvc.crearProfesoresDesdeAsignaturas(this.asignaturas);

    // 3) Finalmente cargamos la lista actualizada de profesores
    this.profesores = this.personalSvc.listar();
  }

  private crearModeloVacio(): Profesor {
    return {
      tipoIdentificacion: 'Cédula',
      identificacion: '',
      nombres: '',
      apellidos: '',
      telefono: '',
      correo: '',
      categoria: '',
      asignaturas: [],
      especialidad: '',
    };
  }

  // ==========================
  // Filtro tabla izquierda
  // ==========================
  get profesoresFiltrados(): Profesor[] {
    const f = this.filtro.trim().toLowerCase();
    if (!f) return this.profesores;

    return this.profesores.filter((p) =>
      (
        `${p.identificacion} ${p.nombres} ${p.apellidos} ${p.categoria} ${p.especialidad ?? ''}`
      )
        .toLowerCase()
        .includes(f)
    );
  }

  get listaFiltrada(): Profesor[] {
    return this.profesoresFiltrados;
  }

  get asignaturasDisponibles(): Asignatura[] {
    return this.asignaturas;
  }

  // ==========================
  // Botones de la cabecera
  // ==========================
  importarDatos(): void {
    console.log('Importar datos de profesores (placeholder)');
    alert('Función "Importar Datos" aún no está implementada.');
  }

  nuevoDocente(): void {
    this.modelo = this.crearModeloVacio();
    this.seleccionado = null;
  }

  // ==========================
  // Selección desde la tabla
  // ==========================
  seleccionar(prof: Profesor): void {
    this.seleccionado = prof;
    this.modelo = {
      ...prof,
      asignaturas: [...(prof.asignaturas || [])],
    };
  }

  // ==========================
  // Guardar
  // ==========================
  guardar(): void {
    if (!this.modelo.asignaturas) {
      this.modelo.asignaturas = [];
    }

    this.personalSvc.guardarProfesor(this.modelo);
    this.cargarDatos();
  }

  // ==========================
  // Utilidad para mostrar asignaturas
  // ==========================
  descripcionAsignaturas(codigos: string[]): string {
    if (!codigos || !codigos.length) return '';

    const mapa = new Map(
      this.asignaturas.map((a) => [a.codigo, a.nombre] as [string, string])
    );

    return codigos
      .map((c) => `${c} - ${mapa.get(c) ?? ''}`)
      .join(', ');
  }

  // ==========================
  // REPORTE PDF
  // ==========================
  imprimirReporteProfesores(): void {
    const data = this.listaFiltrada;
    if (!data.length) {
      alert('No hay profesores para imprimir.');
      return;
    }

    const doc = new jsPDF('l', 'pt', 'a4');
    doc.setFontSize(14);
    doc.text('Reporte de Profesores UASD', 40, 40);

    const body = data.map((p) => [
      p.identificacion,
      `${p.nombres} ${p.apellidos}`,
      p.categoria || '',
      (p.asignaturas && p.asignaturas.length
        ? this.descripcionAsignaturas(p.asignaturas)
        : '—'),
      p.especialidad || '',
      p.correo || '',
      p.telefono || '',
    ]);

    (doc as any).autoTable({
      head: [
        [
          'Identificación',
          'Nombre',
          'Categoría',
          'Asignaturas que imparte',
          'Especialidad',
          'Correo',
          'Teléfono',
        ],
      ],
      body,
      startY: 60,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [13, 110, 253] },
    });

    doc.save('reporte-profesores.pdf');
  }
}
