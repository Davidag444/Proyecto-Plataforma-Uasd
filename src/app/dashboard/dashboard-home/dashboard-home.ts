// src/app/dashboard/dashboard-home/dashboard-home.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface PlanEstudioStorage {
  id: number;
  nombrePlan?: string;
  facultad?: string;
  nivel?: string;
  fechaCreacion?: string;
  estado?: string;      // Puede venir 'Solicitado' / 'solicitado' / etc.
  comentario?: string;  // Motivo si está denegado
  detalle?: any;
}

interface NotificacionPlanDenegado {
  planId: number;
  nombrePlan: string;
  comentario: string;
  fecha: string; // ISO
}

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-home.html',
  styleUrls: ['./dashboard-home.css'],
})
export class DashboardHomeComponent implements OnInit {
  // Contadores
  solicitados = 0;
  revision = 0;
  validados = 0;
  total = 0;

  // Lista de notificaciones a mostrar
  notificaciones: NotificacionPlanDenegado[] = [];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.actualizarContadoresYNotificaciones();
  }

  private normalizarEstado(raw: string | undefined): 'Solicitado' | 'En revisión' | 'Denegado' | 'Validado' {
    if (!raw) return 'Solicitado';

    const v = raw.toLowerCase();

    if (v.includes('revisión') || v.includes('revision')) return 'En revisión';
    if (v.includes('deneg')) return 'Denegado';
    if (v.includes('valid')) return 'Validado';

    return 'Solicitado';
  }

  private actualizarContadoresYNotificaciones() {
    const stored = localStorage.getItem('planes_estudio');
    const planes: PlanEstudioStorage[] = stored ? JSON.parse(stored) : [];

    this.solicitados = 0;
    this.revision = 0;
    this.validados = 0;
    this.total = planes.length;
    this.notificaciones = [];

    for (const p of planes) {
      const estadoNorm = this.normalizarEstado(p.estado);

      // ---- contadores ----
      switch (estadoNorm) {
        case 'En revisión':
          this.revision++;
          break;
        case 'Validado':
          this.validados++;
          break;
        case 'Denegado':
          this.solicitados++; // sigue contando como plan existente
          break;
        default:
          this.solicitados++;
      }

      // ---- notificaciones de denegado ----
      if (estadoNorm === 'Denegado') {
        const comentario = (p.comentario || '').trim();
        this.notificaciones.push({
          planId: p.id,
          nombrePlan: p.nombrePlan || 'Plan sin nombre',
          comentario: comentario || 'Revisar observaciones del evaluador.',
          fecha: p.fechaCreacion || new Date().toISOString(),
        });
      }
    }
  }

  editarPlanDesdeNotificacion(planId: number): void {
    const stored = localStorage.getItem('planes_estudio');
    if (!stored) return;

    const planes: PlanEstudioStorage[] = JSON.parse(stored);
    const plan = planes.find((p) => p.id === planId);
    if (!plan) return;

    // Guardamos el plan a editar para que lo lea el creador
    localStorage.setItem('plan_en_edicion', JSON.stringify(plan));

    // Navegamos al creador dentro del dashboard
    this.router.navigate(['/dashboard/planes-nuevo'], {
      queryParams: { id: plan.id },
    });
  }
}
