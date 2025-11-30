import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Recinto {
  id: number;
  nombre: string;
  sigla: string;
  domicilioLegal: string;
  telefono: string;
  correo: string;
}

const STORAGE_KEY = 'org_recintos';

@Component({
  selector: 'app-recintos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recintos.html',
  styleUrls: ['./recintos.css'],
})
export class RecintosComponent implements OnInit {
  recintos: Recinto[] = [];
  filtro = '';

  // formulario
  editando = false;
  recintoActual: Recinto = this.crearVacio();

  ngOnInit(): void {
    this.cargar();
  }

  private crearVacio(): Recinto {
    return {
      id: 0,
      nombre: '',
      sigla: '',
      domicilioLegal: '',
      telefono: '',
      correo: '',
    };
  }

  private cargar() {
    const raw = localStorage.getItem(STORAGE_KEY);
    this.recintos = raw ? JSON.parse(raw) : [];
  }

  private guardar() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.recintos));
  }

  get recintosFiltrados(): Recinto[] {
    const f = this.filtro.trim().toLowerCase();
    if (!f) return this.recintos;
    return this.recintos.filter((r) =>
      `${r.nombre} ${r.sigla}`.toLowerCase().includes(f)
    );
  }

  nuevo() {
    this.editando = false;
    this.recintoActual = this.crearVacio();
  }

  editar(recinto: Recinto) {
    this.editando = true;
    this.recintoActual = { ...recinto };
  }

  guardarRecinto() {
    if (!this.recintoActual.nombre.trim()) {
      alert('El nombre del recinto es obligatorio.');
      return;
    }

    if (this.editando) {
      this.recintos = this.recintos.map((r) =>
        r.id === this.recintoActual.id ? { ...this.recintoActual } : r
      );
    } else {
      const nuevoId =
        this.recintos.length > 0
          ? Math.max(...this.recintos.map((r) => r.id)) + 1
          : 1;
      this.recintos.push({ ...this.recintoActual, id: nuevoId });
    }

    this.guardar();
    this.nuevo();
  }

  eliminar(recinto: Recinto) {
    if (!confirm(`¿Eliminar el recinto "${recinto.nombre}"?`)) return;
    this.recintos = this.recintos.filter((r) => r.id !== recinto.id);
    this.guardar();
  }
}
