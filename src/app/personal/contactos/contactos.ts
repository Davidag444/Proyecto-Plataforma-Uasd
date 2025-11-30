// src/app/personal/contactos/contactos.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Contacto {
  id: number;
  nombre: string;
  correo: string;
  telefono: string;
  tipo: string;
}

@Component({
  selector: 'app-contactos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contactos.html',
  styleUrls: ['./contactos.css'],
})
export class ContactosComponent implements OnInit {
  private readonly storageKey = 'contactos_personal';

  contactos: Contacto[] = [];
  modelo: Contacto = this.vacio();

  ngOnInit(): void {
    this.cargarContactos();
  }

  // ---------- Modelo vacío ----------
  private vacio(): Contacto {
    return {
      id: 0,
      nombre: '',
      correo: '',
      telefono: '',
      tipo: '',
    };
  }

  // ---------- Persistencia ----------
  private cargarContactos(): void {
    const raw = localStorage.getItem(this.storageKey);
    if (raw) {
      this.contactos = JSON.parse(raw);
    }
  }

  private guardarContactos(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this.contactos));
  }

  // ---------- Guardar contacto ----------
  guardar() {
    if (!this.modelo.nombre.trim()) {
      alert('El nombre es obligatorio.');
      return;
    }

    const nuevo: Contacto = {
      ...this.modelo,
      id:
        (this.contactos.length
          ? Math.max(...this.contactos.map((x) => x.id))
          : 0) + 1,
    };

    this.contactos.push(nuevo);
    this.guardarContactos(); // <<--- Persistencia

    this.modelo = this.vacio();
  }
}
