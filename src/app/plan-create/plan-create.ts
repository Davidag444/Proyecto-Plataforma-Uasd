// src/app/plan-create/plan-create.ts
import { Component, OnInit } from '@angular/core';
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

interface PlanPeriodoAsignatura {
  codigo: string;
  nombre: string;
  creditos: number;
  ht: number;
  hp: number;
  componenteFormacion: string;
}

interface PlanPeriodo {
  numero: number;
  cicloFormacion?: string;
  asignaturas: PlanPeriodoAsignatura[];
}

@Component({
  selector: 'app-plan-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './plan-create.html',
  styleUrls: ['./plan-create.css'],
})
export class PlanCreateComponent implements OnInit {
  // --- modo edición ---
  private editingId: number | null = null;
  private estadoOriginal: string | undefined;
  private comentarioOriginal: string | undefined;

  // Wizard
  pasoActual = 0;

  // Paso 0
  tituloPlan = '';
  facultad = '';
  escuela = '';
  nivel = 'Grado';
  modalidad = 'Presencial';

  // Paso 1
  introduccion = '';
  antecedentes = '';
  fundamentosFilosoficos = '';

  // Paso 2
  areaDisciplinaria = '';
  areaConocimiento = '';
  duracionPeriodos: number | null = null;
  plazas: number | null = null;

  // Pasos 3, 4, 5
  justificacionTexto = '';
  gestionBienestarTexto = '';
  competenciasTexto = '';

  // Paso 6
  periodos: PlanPeriodo[] = [];
  siguienteNumeroPeriodo = 1;

  asignaturasDisponibles: Asignatura[] = [];

  mostrarModalAsignaturas = false;
  indicePeriodoSeleccionado: number | null = null;
  seleccionTemporalCodigos = new Set<string>();

  constructor(
    private asigSvc: AsignaturasService,
    private personalSvc: PersonalService
  ) {}

  ngOnInit(): void {
    this.asignaturasDisponibles = this.asigSvc.listar();

    // Modo edición: ver si hay un plan almacenado en plan_en_edicion
    const rawEdit = localStorage.getItem('plan_en_edicion');
    if (rawEdit) {
      try {
        const plan = JSON.parse(rawEdit);
        this.cargarPlanEnFormulario(plan);
        // limpíamos la marca para que un nuevo plan empiece limpio
        localStorage.removeItem('plan_en_edicion');
      } catch {
        // Si algo falla, empezamos vacío
        this.inicializarPeriodos();
      }
    } else {
      this.inicializarPeriodos();
    }
  }

  private inicializarPeriodos() {
    if (this.periodos.length === 0) {
      this.agregarPeriodo();
    }
  }

  // Cargar todos los datos de un plan en el formulario (modo edición)
  private cargarPlanEnFormulario(plan: any) {
    this.editingId = plan.id;
    this.estadoOriginal = plan.estado;
    this.comentarioOriginal = plan.comentario;

    // Datos visibles de la tabla
    this.facultad = plan.facultad || '';
    this.tituloPlan = plan.nombrePlan || '';
    this.nivel = plan.nivel || 'Grado';

    const d = plan.detalle || {};

    const p0 = d.parametrosIniciales || {};
    this.escuela = p0.escuela || '';
    this.modalidad = p0.modalidad || 'Presencial';

    const intro = d.introduccion || {};
    this.introduccion = intro.introduccion || '';
    this.antecedentes = intro.antecedentes || '';
    this.fundamentosFilosoficos =
      intro.fundamentosFilosoficos || '';

    const desc = d.descripcion || {};
    this.areaDisciplinaria = desc.areaDisciplinaria || '';
    this.areaConocimiento = desc.areaConocimiento || '';
    this.duracionPeriodos = desc.duracionPeriodos ?? null;
    this.plazas = desc.plazas ?? null;

    this.justificacionTexto = d.justificacion || '';
    this.gestionBienestarTexto = d.gestionBienestar || '';
    this.competenciasTexto = d.competencias || '';

    const planif = d.planificacionCurricular || {};
    this.periodos = (planif.periodos as PlanPeriodo[]) || [];

    if (!this.periodos || this.periodos.length === 0) {
      this.inicializarPeriodos();
    } else {
      this.siguienteNumeroPeriodo =
        Math.max(...this.periodos.map((p: any) => p.numero || 0)) + 1;
    }
  }

  // Progreso
  get progreso(): number {
    const totalPasos = 7;
    return ((this.pasoActual + 1) / totalPasos) * 100;
  }

  irPaso(p: number) {
    if (p >= 0 && p <= 6) {
      this.pasoActual = p;
    }
  }

  siguientePaso() {
    if (this.pasoActual < 6) this.pasoActual++;
  }

  pasoAnterior() {
    if (this.pasoActual > 0) this.pasoActual--;
  }

  // Periodos
  agregarPeriodo() {
    this.periodos.push({
      numero: this.siguienteNumeroPeriodo++,
      asignaturas: [],
    });
  }

  eliminarPeriodo(index: number) {
    if (!confirm('¿Eliminar este período completo?')) return;
    this.periodos.splice(index, 1);
    this.periodos.forEach((p, idx) => (p.numero = idx + 1));
    this.siguienteNumeroPeriodo = this.periodos.length + 1;
  }

  // Modal asignaturas
  abrirSelectorAsignaturas(indicePeriodo: number) {
    this.indicePeriodoSeleccionado = indicePeriodo;
    this.seleccionTemporalCodigos.clear();

    const periodo = this.periodos[indicePeriodo];
    for (const a of periodo.asignaturas) {
      this.seleccionTemporalCodigos.add(a.codigo);
    }

    this.mostrarModalAsignaturas = true;
  }

  cerrarSelectorAsignaturas() {
    this.mostrarModalAsignaturas = false;
    this.indicePeriodoSeleccionado = null;
    this.seleccionTemporalCodigos.clear();
  }

  estaSeleccionada(asig: Asignatura): boolean {
    return this.seleccionTemporalCodigos.has(asig.codigo);
  }

  toggleSeleccionAsignatura(asig: Asignatura) {
    if (this.seleccionTemporalCodigos.has(asig.codigo)) {
      this.seleccionTemporalCodigos.delete(asig.codigo);
    } else {
      this.seleccionTemporalCodigos.add(asig.codigo);
    }
  }

  confirmarSeleccionAsignaturas() {
    if (this.indicePeriodoSeleccionado === null) return;

    const periodo = this.periodos[this.indicePeriodoSeleccionado];

    const seleccionadas = this.asignaturasDisponibles
      .filter((a) => this.seleccionTemporalCodigos.has(a.codigo))
      .map<PlanPeriodoAsignatura>((a) => ({
        codigo: a.codigo,
        nombre: a.nombre,
        creditos: a.creditos ?? 0,
        ht: a.ht ?? 0,
        hp: a.hp ?? 0,
        componenteFormacion: a.area || a.tipo || 'General',
      }));

    periodo.asignaturas = seleccionadas;
    this.cerrarSelectorAsignaturas();
  }

  // Titular
  getTitularAsignatura(asig: Asignatura | PlanPeriodoAsignatura): string {
    if (!asig || !asig.codigo) return '—';

    const profesores: Profesor[] =
      this.personalSvc.getProfesoresPorAsignatura(asig.codigo);

    if (!profesores || profesores.length === 0) return '—';

    const titular = profesores[0];
    return `${titular.nombres} ${titular.apellidos}`;
  }

  // Edición de HT/HP
  editarAsignaturaPeriodo(periodo: PlanPeriodo, index: number) {
    const asig = periodo.asignaturas[index];
    const nuevoHT = prompt(
      `Editar HT para ${asig.codigo} - ${asig.nombre}`,
      String(asig.ht)
    );
    const nuevoHP = prompt(
      `Editar HP para ${asig.codigo} - ${asig.nombre}`,
      String(asig.hp)
    );

    if (nuevoHT !== null) asig.ht = Number(nuevoHT) || 0;
    if (nuevoHP !== null) asig.hp = Number(nuevoHP) || 0;
  }

  eliminarAsignaturaDePeriodo(periodo: PlanPeriodo, index: number) {
    if (
      !confirm(
        `¿Eliminar la asignatura "${periodo.asignaturas[index].nombre}" del período?`
      )
    )
      return;

    periodo.asignaturas.splice(index, 1);
  }

  // Totales
  totalCreditos(periodo: PlanPeriodo): number {
    return periodo.asignaturas.reduce(
      (acc, a) => acc + (a.creditos || 0),
      0
    );
  }

  totalHT(periodo: PlanPeriodo): number {
    return periodo.asignaturas.reduce(
      (acc, a) => acc + (a.ht || 0),
      0
    );
  }

  totalHP(periodo: PlanPeriodo): number {
    return periodo.asignaturas.reduce(
      (acc, a) => acc + (a.hp || 0),
      0
    );
  }

  // Guardar plan (crear o actualizar)
  guardarPlanCompleto() {
    const raw = localStorage.getItem('planes_estudio');
    const lista: any[] = raw ? JSON.parse(raw) : [];

    // Datos comunes (sin id ni estado todavía)
    const basePlan = {
      facultad: this.facultad,
      nombrePlan: this.tituloPlan,
      nivel: this.nivel,
      fechaCreacion: new Date().toISOString(),
      detalle: {
        parametrosIniciales: {
          tituloPlan: this.tituloPlan,
          facultad: this.facultad,
          escuela: this.escuela,
          nivel: this.nivel,
          modalidad: this.modalidad,
        },
        introduccion: {
          introduccion: this.introduccion,
          antecedentes: this.antecedentes,
          fundamentosFilosoficos: this.fundamentosFilosoficos,
        },
        descripcion: {
          areaDisciplinaria: this.areaDisciplinaria,
          areaConocimiento: this.areaConocimiento,
          duracionPeriodos: this.duracionPeriodos,
          plazas: this.plazas,
        },
        justificacion: this.justificacionTexto,
        gestionBienestar: this.gestionBienestarTexto,
        competencias: this.competenciasTexto,
        planificacionCurricular: {
          periodos: this.periodos,
        },
      },
    };

    if (this.editingId != null) {
      // Actualizar un plan existente
      const idx = lista.findIndex((p) => p.id === this.editingId);
      if (idx !== -1) {
        let estado = this.estadoOriginal || 'Solicitado';
        let comentario = this.comentarioOriginal || '';

        // Si estaba denegado, al reenviar lo ponemos como "Solicitado"
        if (
          estado === 'Denegado' ||
          estado === 'denegado'
        ) {
          estado = 'Solicitado';
          comentario = '';
        }

        lista[idx] = {
          ...lista[idx],
          ...basePlan,
          id: this.editingId,
          estado,
          comentario,
        };
      }
    } else {
      // Crear uno nuevo
      const nuevoId =
        lista.length > 0
          ? Math.max(...lista.map((p) => p.id || 0)) + 1
          : 1;

      const nuevoPlan = {
        id: nuevoId,
        estado: 'Solicitado',
        comentario: '',
        ...basePlan,
      };

      lista.push(nuevoPlan);
    }

    localStorage.setItem('planes_estudio', JSON.stringify(lista));
    alert(
      'Plan de estudio guardado en "Mis Planes de Estudio" (localStorage).'
    );
  }
}
