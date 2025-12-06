// src/app/dashboard/dashboard-home/dashboard-home.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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

type TipoNotificacion = 'Denegado' | 'Solicitado';

interface NotificacionPlan {
  planId: number;
  nombrePlan: string;
  comentario: string;
  fecha: string; // ISO
  tipo: TipoNotificacion;
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
  notificaciones: NotificacionPlan[] = [];

  constructor(
    private router: Router,
    private auth: AuthService
  ) {}

  // === Helpers de rol para el HTML ===
  get esUniversidad(): boolean {
    return this.auth.isUniversidad();
  }

  get esEvaluador(): boolean {
    return this.auth.isEvaluador();
  }

  ngOnInit(): void {
    this.actualizarContadoresYNotificaciones();
  }

  private normalizarEstado(
    raw: string | undefined
  ): 'Solicitado' | 'En revisión' | 'Denegado' | 'Validado' {
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
          // lo seguimos contando dentro de "solicitados"
          this.solicitados++;
          break;
        default:
          this.solicitados++;
      }

      // Base común para la notificación
      const baseNotif = {
        planId: p.id,
        nombrePlan: p.nombrePlan || 'Plan sin nombre',
        fecha: p.fechaCreacion || new Date().toISOString(),
      };

      // ---- notificaciones de DENEGADO ----
      if (estadoNorm === 'Denegado') {
        const comentario = (p.comentario || '').trim();
        this.notificaciones.push({
          ...baseNotif,
          tipo: 'Denegado',
          comentario: comentario || 'Revisar observaciones del evaluador.',
        });
      }

      // ---- notificaciones de SOLICITADO ----
      if (estadoNorm === 'Solicitado') {
        this.notificaciones.push({
          ...baseNotif,
          tipo: 'Solicitado',
          comentario: 'Plan enviado y pendiente de evaluación.',
        });
      }
    }
  }

  // Navega al formulario del plan (misma lógica que antes)
  editarPlanDesdeNotificacion(planId: number): void {
    const stored = localStorage.getItem('planes_estudio');
    if (!stored) return;

    const planes: PlanEstudioStorage[] = JSON.parse(stored);
    const plan = planes.find((p) => p.id === planId);
    if (!plan) return;

    // Guardamos el plan a editar para que lo lea el creador / evaluador
    localStorage.setItem('plan_en_edicion', JSON.stringify(plan));

    // Navegamos al creador dentro del dashboard
    this.router.navigate(['/dashboard/planes-nuevo'], {
      queryParams: { id: plan.id },
    });
  }
}
