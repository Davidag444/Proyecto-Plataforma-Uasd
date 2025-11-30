// src/app/competencias/competencias-fundamentales.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface CompetenciaFundamental {
  id: number;
  codigo: string;
  nombre: string;
  institucion: string;
}

@Component({
  selector: 'app-competencias-fundamentales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './competencias-fundamentales.html',
  styleUrls: ['./competencias-fundamentales.css'],
})
export class CompetenciasFundamentalesComponent implements OnInit {
  private readonly STORAGE_KEY = 'competencias_fundamentales_uasd';

  competencias: CompetenciaFundamental[] = [];
  filtro = '';

  competenciaActual: CompetenciaFundamental = this.crearModeloVacio();
  editando = false;
  mostrarForm = false;

  ngOnInit(): void {
    this.cargar();
  }

  // ===== helpers =====
  private crearModeloVacio(): CompetenciaFundamental {
    return {
      id: 0,
      codigo: '',
      nombre: '',
      institucion: 'UASD',
    };
  }

  private cargar(): void {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    this.competencias = raw ? (JSON.parse(raw) as CompetenciaFundamental[]) : [];
  }

  private guardarStorage(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.competencias));
  }

  get competenciasFiltradas(): CompetenciaFundamental[] {
    const f = this.filtro.trim().toLowerCase();
    if (!f) return this.competencias;

    return this.competencias.filter((c) =>
      `${c.institucion} ${c.codigo} ${c.nombre}`.toLowerCase().includes(f)
    );
  }

  // ===== acciones =====
  nuevaCompetencia(): void {
    this.competenciaActual = this.crearModeloVacio();
    this.editando = false;
    this.mostrarForm = true;
  }

  editarCompetencia(c: CompetenciaFundamental): void {
    this.competenciaActual = { ...c };
    this.editando = true;
    this.mostrarForm = true;
  }

  cancelarForm(): void {
    this.mostrarForm = false;
    this.editando = false;
  }

  guardarCompetencia(): void {
    const c = this.competenciaActual;

    if (!c.codigo.trim()) {
      alert('El código de la competencia es obligatorio.');
      return;
    }
    if (!c.nombre.trim()) {
      alert('El nombre de la competencia es obligatorio.');
      return;
    }

    if (this.editando) {
      const idx = this.competencias.findIndex((x) => x.id === c.id);
      if (idx !== -1) {
        this.competencias[idx] = { ...c };
      }
    } else {
      const nuevoId =
        this.competencias.length > 0
          ? Math.max(...this.competencias.map((x) => x.id)) + 1
          : 1;
      this.competencias.push({ ...c, id: nuevoId });
    }

    this.guardarStorage();
    this.mostrarForm = false;
    this.editando = false;
  }

  eliminarCompetencia(c: CompetenciaFundamental): void {
    if (!confirm(`¿Eliminar la competencia "${c.codigo} - ${c.nombre}"?`)) {
      return;
    }

    this.competencias = this.competencias.filter((x) => x.id !== c.id);
    this.guardarStorage();
  }
}
