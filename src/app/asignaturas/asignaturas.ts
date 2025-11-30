// src/app/asignaturas/asignaturas.ts
import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  Asignatura,
  AsignaturasService,
} from '../services/asignaturas.service';

import {
  PersonalService,
  Profesor,
} from '../services/personal.service';

// XLSX viene desde un <script> en index.html
declare const XLSX: any;

@Component({
  selector: 'app-asignaturas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './asignaturas.html',
  styleUrls: ['./asignaturas.css'],
})
export class AsignaturasComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  filtro = '';

  asignaturas: Asignatura[] = [];
  profesores: Profesor[] = [];

  mostrarFormNueva = false;
  editando = false;
  codigoOriginalEdicion: string | null = null;

  nuevaAsignatura: Asignatura = {
    codigo: '',
    nombre: '',
    creditos: 0,
    tipo: '',
    area: '',
    ht: 0,
    hp: 0,
  };

  constructor(
    private asigSvc: AsignaturasService,
    private personalSvc: PersonalService
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  private cargarDatos(): void {
    this.asignaturas = this.asigSvc.listar();
    this.profesores = this.personalSvc.listar();
  }

  // ==========================
  // Filtro de búsqueda
  // ==========================
  get asignaturasFiltradas(): Asignatura[] {
    const f = this.filtro.trim().toLowerCase();
    if (!f) return this.asignaturas;

    return this.asignaturas.filter((a) =>
      (
        `${a.codigo} ${a.nombre} ${a.tipo ?? ''} ${a.area ?? ''}`
      )
        .toLowerCase()
        .includes(f)
    );
  }

  // ==========================
  //  edición manual jiji
  // ==========================
  abrirFormNueva(): void {
    this.nuevaAsignatura = {
      codigo: '',
      nombre: '',
      creditos: 0,
      tipo: '',
      area: '',
      ht: 0,
      hp: 0,
    };
    this.editando = false;
    this.codigoOriginalEdicion = null;
    this.mostrarFormNueva = true;
  }

  editar(asig: Asignatura): void {
    this.nuevaAsignatura = { ...asig };
    this.editando = true;
    this.codigoOriginalEdicion = asig.codigo;
    this.mostrarFormNueva = true;
  }

  cerrarFormNueva(): void {
    this.mostrarFormNueva = false;
    this.editando = false;
    this.codigoOriginalEdicion = null;
  }

  guardarNueva(): void {
    if (!this.nuevaAsignatura.codigo || !this.nuevaAsignatura.nombre) {
      alert('Código y nombre son obligatorios.');
      return;
    }

    if (this.editando && this.codigoOriginalEdicion) {
      this.asigSvc.actualizar(
        this.codigoOriginalEdicion,
        this.nuevaAsignatura
      );
    } else {
      this.asigSvc.agregarManual(this.nuevaAsignatura);
    }

    // 🔗 Crear/actualizar profesor automáticamente para esta asignatura
    this.personalSvc.crearProfesorDesdeAsignatura(this.nuevaAsignatura);

    this.cerrarFormNueva();
    this.cargarDatos();
  }

  eliminar(asig: Asignatura): void {
    if (!confirm(`¿Eliminar la asignatura "${asig.nombre}"?`)) return;
    this.asigSvc.eliminar(asig.codigo);
    this.cargarDatos();
  }

  // ==========================
  // Personal académico
  // ==========================
  getProfesoresParaAsignatura(codigoAsignatura: string): Profesor[] {
    return this.personalSvc.obtenerPorAsignatura(codigoAsignatura);
  }

  getPersonalAcademico(codigoAsignatura: string): string {
    const profs = this.getProfesoresParaAsignatura(codigoAsignatura);
    if (!profs.length) return '';
    return profs
      .map((p) => `${p.nombres} ${p.apellidos}`.trim())
      .join(', ');
  }

  // ==========================
  // Importar desde Excel (.xls, .xlsx, .xlsm)
  // ==========================
  clickImportarDesdeExcel(): void {
    if (this.fileInput) {
      this.fileInput.nativeElement.click();
    }
  }

  importarDesdeExcel(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);

        const workbook = XLSX.read(data, {
          type: 'array',
          cellDates: true,
          cellNF: false,
          cellText: false,
          bookVBA: true,
          dense: true,
        });

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        if (!sheet) {
          alert('El archivo no contiene hojas válidas.');
          return;
        }

        const rows: any[][] = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          raw: true,
          defval: '',
          blankrows: false,
        });

        if (!rows.length) {
          alert('El Excel está vacío.');
          return;
        }

        const esEncabezado = (r: any[]): boolean => {
          const upper = r.map((c) => String(c || '').toUpperCase());
          const tieneCodigo = upper.some(
            (c) => c.includes('CLAVE') || c.includes('CÓDIGO')
          );
          const tieneNombre = upper.some(
            (c) => c.includes('ASIGNATUR') || c.includes('NOMBRE')
          );
          return tieneCodigo && tieneNombre;
        };

        let headerIndex = rows.findIndex((r) => r && esEncabezado(r));
        if (headerIndex === -1) headerIndex = 0;

        const header = rows[headerIndex];

        const columna = (buscas: string[], fallback: number): number => {
          const idx = header.findIndex((c) => {
            const t = String(c || '').toUpperCase();
            return buscas.some((b) => t.includes(b));
          });
          return idx >= 0 ? idx : fallback;
        };

        const idxCodigo = columna(['CLAVE', 'CÓDIGO'], 0);
        const idxNombre = columna(['ASIGNATUR', 'NOMBRE'], 1);
        const idxCR = columna(['CR', 'CRÉDITO'], 8);
        const idxHT = columna(['HT', 'HORAS T'], 2);
        const idxHP = columna(['HP', 'HORAS P'], 3);
        const idxComponente = columna(['COMPONENTE', 'ÁREA', 'FORMACI'], 10);

        const importadas: Asignatura[] = [];

        for (let i = headerIndex + 1; i < rows.length; i++) {
          const r = rows[i];
          if (!r || !r.length) continue;

          const codigo = r[idxCodigo];
          const nombre = r[idxNombre];

          if (!codigo || !nombre) continue;

          importadas.push({
            codigo: String(codigo).trim(),
            nombre: String(nombre).trim(),
            creditos: Number(r[idxCR] || 0),
            ht: Number(r[idxHT] || 0),
            hp: Number(r[idxHP] || 0),
            area: r[idxComponente] ? String(r[idxComponente]).trim() : '',
            tipo: r[idxComponente] ? String(r[idxComponente]).trim() : '',
          });
        }

        if (!importadas.length) {
          alert('No se encontraron asignaturas en el archivo.');
          return;
        }

        // Guardar asignaturas
        this.asigSvc.agregarDesdeExcel(importadas);

        // 🔗 Crear profesores automáticos para todas las importadas
        this.personalSvc.crearProfesoresDesdeAsignaturas(importadas);

        this.cargarDatos();
        alert(`Se importaron ${importadas.length} asignaturas.`);
      } catch (err) {
        console.error('❌ Error procesando Excel:', err);
        alert('Ocurrió un error leyendo el archivo Excel. Revisa la consola.');
      }
    };

    reader.readAsArrayBuffer(file);
    input.value = '';
  }
}
