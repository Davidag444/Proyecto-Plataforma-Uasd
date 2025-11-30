// src/app/competencias/competencias-especificas.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface CompetenciaEspecifica {
  id: number;
  codigo: string;
  nombre: string;
  institucion: string;
}

@Component({
  selector: 'app-competencias-especificas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './competencias-especificas.html',
  styleUrls: ['./competencias-especificas.css'],
})
export class CompetenciasEspecificasComponent implements OnInit {

  private readonly STORAGE_KEY = 'competencias_especificas_uasd';

  competencias: CompetenciaEspecifica[] = [];
  filtro = '';

  competenciaActual: CompetenciaEspecifica = this.newModel();
  editando = false;
  mostrarForm = false;

  ngOnInit(): void {
    this.cargar();
  }

  // ===== Helpers =====
  private newModel(): CompetenciaEspecifica {
    return {
      id: 0,
      codigo: '',
      nombre: '',
      institucion: 'UASD',
    };
  }

  private cargar(): void {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    this.competencias = raw ? (JSON.parse(raw) as CompetenciaEspecifica[]) : [];
  }

  private guardarStorage(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.competencias));
  }

  get competenciasFiltradas(): CompetenciaEspecifica[] {
    const f = this.filtro.toLowerCase().trim();
    if (!f) return this.competencias;

    return this.competencias.filter((c) =>
      `${c.codigo} ${c.nombre} ${c.institucion}`.toLowerCase().includes(f)
    );
  }

  // ===== Acciones =====
  nueva(): void {
    this.competenciaActual = this.newModel();
    this.editando = false;
    this.mostrarForm = true;
  }

  editar(c: CompetenciaEspecifica): void {
    this.competenciaActual = { ...c };
    this.editando = true;
    this.mostrarForm = true;
  }

  cancelar(): void {
    this.mostrarForm = false;
  }

  guardar(): void {
    const c = this.competenciaActual;

    if (!c.codigo.trim()) return alert('Debe ingresar un código.');
    if (!c.nombre.trim()) return alert('Debe ingresar el nombre.');

    if (this.editando) {
      const index = this.competencias.findIndex((x) => x.id === c.id);
      if (index !== -1) this.competencias[index] = { ...c };
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

  eliminar(c: CompetenciaEspecifica): void {
    if (!confirm(`¿Eliminar competencia ${c.codigo}?`)) return;

    this.competencias = this.competencias.filter((x) => x.id !== c.id);
    this.guardarStorage();
  }
}
