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

import { AuthService } from '../services/auth.service';

interface PlanPeriodoAsignatura {
  codigo: string;
  nombre: string;
  creditos: number;          // AHORA: HT + HP
  ht: number;
  hp: number;
  componenteFormacion: string;
}

interface PlanPeriodo {
  numero: number;
  cicloFormacion?: string;
  asignaturas: PlanPeriodoAsignatura[];
}

// ===== Evaluación técnica (maqueta) =====
export type EvalValor =
  | 'Favorable'
  | 'Mejorable'
  | 'PorDefinir'
  | 'Desfavorable';

export interface EvalItem {
  id: string;
  titulo: string;
  resultado: EvalValor;
  comentario: string;
}

// Evaluación simple por página (pasos 0–6)
export interface EvalPagina {
  idPaso: number;        // 0..6
  titulo: string;        // solo referencia
  resultado: EvalValor;
  comentario: string;
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

  // ===== CONSTANTES =====
  private readonly MAX_CREDITOS_POR_PERIODO = 30;

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

  // ===== Evaluación del plan (maqueta, paso 7) =====
  evalOpciones = [
    { label: 'Favorable', value: 'Favorable' as EvalValor },
    { label: 'Mejorable', value: 'Mejorable' as EvalValor },
    { label: 'Por Definir', value: 'PorDefinir' as EvalValor },
    { label: 'Desfavorable', value: 'Desfavorable' as EvalValor },
  ];

  // Evaluación técnica del plan (solo paso 7)
  evaluacionesTecnicas: EvalItem[] = [
    {
      id: 'escalabilidad',
      titulo: '1. Escalabilidad',
      resultado: 'Favorable',
      comentario: '',
    },
    {
      id: 'interactividad',
      titulo: '2. Interactividad',
      resultado: 'Favorable',
      comentario: '',
    },
    {
      id: 'versatilidad',
      titulo: '3. Versatilidad',
      resultado: 'Favorable',
      comentario: '',
    },
    {
      id: 'usabilidad',
      titulo: '4. Usabilidad',
      resultado: 'Favorable',
      comentario: '',
    },
    {
      id: 'interfaces',
      titulo: '5. Interfaces',
      resultado: 'Favorable',
      comentario: '',
    },
  ];

  // Evaluación simple por página (0–6)
  evalPaginas: EvalPagina[] = [
    {
      idPaso: 0,
      titulo: 'Parámetros iniciales',
      resultado: 'Favorable',
      comentario: '',
    },
    {
      idPaso: 1,
      titulo: 'Introducción',
      resultado: 'Favorable',
      comentario: '',
    },
    {
      idPaso: 2,
      titulo: 'Descripción',
      resultado: 'Favorable',
      comentario: '',
    },
    {
      idPaso: 3,
      titulo: 'Justificación',
      resultado: 'Favorable',
      comentario: '',
    },
    {
      idPaso: 4,
      titulo: 'Gestión y Bienestar',
      resultado: 'Favorable',
      comentario: '',
    },
    {
      idPaso: 5,
      titulo: 'Competencias',
      resultado: 'Favorable',
      comentario: '',
    },
    {
      idPaso: 6,
      titulo: 'Planificación Curricular',
      resultado: 'Favorable',
      comentario: '',
    },
  ];

  comentarioGeneralEvaluador = '';

  constructor(
    private asigSvc: AsignaturasService,
    private personalSvc: PersonalService,
    private auth: AuthService
  ) {}

  // === Helpers de rol para la vista ===
  get esUniversidad(): boolean {
    return this.auth.isUniversidad();
  }

  get esEvaluador(): boolean {
    return this.auth.isEvaluador();
  }

  ngOnInit(): void {
    this.asignaturasDisponibles = this.asigSvc.listar();

    const rawEdit = localStorage.getItem('plan_en_edicion');
    if (rawEdit) {
      try {
        const plan = JSON.parse(rawEdit);
        this.cargarPlanEnFormulario(plan);
        localStorage.removeItem('plan_en_edicion');
      } catch {
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

  /** Calcula créditos lógicos a partir de HT+HP */
  private calcularCreditosDesdeHoras(
    ht: number | undefined,
    hp: number | undefined
  ): number {
    const te = Number(ht) || 0;
    const pr = Number(hp) || 0;
    return te + pr;
  }

  /** Recalcula créditos (HT+HP) para TODAS las asignaturas de TODOS los periodos */
  private recalcularCreditosPeriodos(): void {
    for (const periodo of this.periodos) {
      for (const a of periodo.asignaturas) {
        const ht = Number(a.ht) || 0;
        const hp = Number(a.hp) || 0;
        a.ht = ht;
        a.hp = hp;
        a.creditos = this.calcularCreditosDesdeHoras(ht, hp);
      }
    }
  }

  private cargarPlanEnFormulario(plan: any) {
    this.editingId = plan.id;
    this.estadoOriginal = plan.estado;
    this.comentarioOriginal = plan.comentario;

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

    // Recalcular créditos lógicos desde HT/HP para planes antiguos
    this.recalcularCreditosPeriodos();
  }

  // Progreso (la pestaña 7 no agrega pasos nuevos, sólo maqueta)
  get progreso(): number {
    const totalPasos = 7; // 0..6 para el llenado del profesor
    const pasoParaProgreso = Math.min(this.pasoActual, 6);
    return ((pasoParaProgreso + 1) / totalPasos) * 100;
  }

  // Límite de paso según rol
  private get maxPaso(): number {
    return this.esEvaluador ? 7 : 6;
  }

  irPaso(p: number) {
    if (p >= 0 && p <= this.maxPaso) {
      this.pasoActual = p;
    }
  }

  siguientePaso() {
    if (this.pasoActual < this.maxPaso) {
      this.pasoActual++;
    }
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

    // Construimos las asignaturas con créditos = HT + HP
    const seleccionadas = this.asignaturasDisponibles
      .filter((a) => this.seleccionTemporalCodigos.has(a.codigo))
      .map<PlanPeriodoAsignatura>((a) => {
        const ht = a.ht ?? 0;
        const hp = a.hp ?? 0;
        const creditos = this.calcularCreditosDesdeHoras(ht, hp);
        return {
          codigo: a.codigo,
          nombre: a.nombre,
          creditos,
          ht,
          hp,
          componenteFormacion: a.area || a.tipo || 'General',
        };
      });

    // Validar límite de 30 créditos
    const totalCreditosNuevo = seleccionadas.reduce(
      (acc, asig) => acc + (asig.creditos || 0),
      0
    );

    if (totalCreditosNuevo > this.MAX_CREDITOS_POR_PERIODO) {
      alert(
        `El semestre tendría ${totalCreditosNuevo} créditos.\n` +
          `El máximo permitido es ${this.MAX_CREDITOS_POR_PERIODO}.\n` +
          'Reduce la cantidad de asignaturas o las horas HT/HP.'
      );
      return;
    }

    periodo.asignaturas = seleccionadas;
    this.cerrarSelectorAsignaturas();
  }

  // Titular
  getTitularAsignatura(
    asig: Asignatura | PlanPeriodoAsignatura
  ): string {
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
    const nuevoHTStr = prompt(
      `Editar HT para ${asig.codigo} - ${asig.nombre}`,
      String(asig.ht)
    );
    const nuevoHPStr = prompt(
      `Editar HP para ${asig.codigo} - ${asig.nombre}`,
      String(asig.hp)
    );

    if (nuevoHTStr === null && nuevoHPStr === null) return;

    const nuevoHT = nuevoHTStr !== null ? Number(nuevoHTStr) || 0 : asig.ht;
    const nuevoHP = nuevoHPStr !== null ? Number(nuevoHPStr) || 0 : asig.hp;

    const nuevosCreditos = this.calcularCreditosDesdeHoras(
      nuevoHT,
      nuevoHP
    );

    // Calculamos los créditos del período sin esta asignatura
    const totalSinActual = periodo.asignaturas.reduce(
      (acc, a, idx) =>
        idx === index ? acc : acc + (a.creditos || 0),
      0
    );

    const totalConNuevo = totalSinActual + nuevosCreditos;

    if (totalConNuevo > this.MAX_CREDITOS_POR_PERIODO) {
      alert(
        `Con estos cambios el semestre tendría ${totalConNuevo} créditos.\n` +
          `El máximo permitido es ${this.MAX_CREDITOS_POR_PERIODO}.\n` +
          'Ajusta las horas HT/HP o elimina alguna asignatura.'
      );
      return;
    }

    // Aplicamos cambios
    asig.ht = nuevoHT;
    asig.hp = nuevoHP;
    asig.creditos = nuevosCreditos;
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
      const idx = lista.findIndex((p) => p.id === this.editingId);
      if (idx !== -1) {
        let estado = this.estadoOriginal || 'Solicitado';
        let comentario = this.comentarioOriginal || '';

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

  // ========= EVALUACIÓN: helpers =========

  // Evaluación de la página actual (0–6)
  get evalPaginaActual(): EvalPagina | null {
    const found = this.evalPaginas.find(
      (e) => e.idPaso === this.pasoActual
    );
    return found || null;
  }

  // ========= EVALUACIÓN: helpers para estadísticas =========
  get evalStats() {
    const counts: Record<EvalValor, number> = {
      Favorable: 0,
      Mejorable: 0,
      PorDefinir: 0,
      Desfavorable: 0,
    };

    // 1) resultados de TODAS las páginas (0–6)
    const resultadosPaginas = this.evalPaginas.map(
      (p) => p.resultado
    );

    // 2) resultados de TODAS las características técnicas (página 7)
    const resultadosTecnicos = this.evaluacionesTecnicas.map(
      (t) => t.resultado
    );

    const todosLosResultados: EvalValor[] = [
      ...resultadosPaginas,
      ...resultadosTecnicos,
    ];

    const total = todosLosResultados.length || 1;

    for (const r of todosLosResultados) {
      counts[r]++;
    }

    const porcentaje: Record<EvalValor, number> = {
      Favorable: Math.round((counts.Favorable * 100) / total),
      Mejorable: Math.round((counts.Mejorable * 100) / total),
      PorDefinir: Math.round((counts.PorDefinir * 100) / total),
      Desfavorable: Math.round((counts.Desfavorable * 100) / total),
    };

    return { total, counts, porcentaje };
  }

  // ========= RESULTADO GLOBAL =========
  get evalResultadoFinal() {
    const { porcentaje } = this.evalStats;
    const score = porcentaje.Favorable; // % de evaluaciones favorables

    let texto = '';
    let clase = '';

    if (score > 80) {
      // supera el 80%  -> Favorable
      texto = 'Favorable';
      clase = 'res-fav';
    } else if (score >= 68) {
      // entre 68% y 79% -> Mejorable
      texto = 'Mejorable';
      clase = 'res-mej';
    } else if (score >= 46) {
      // entre 46% y 67% -> Por Definir
      texto = 'Por Definir';
      clase = 'res-pdef';
    } else {
      // debajo de 45% -> Desfavorable
      texto = 'Desfavorable';
      clase = 'res-desf';
    }

    return { score, texto, clase };
  }

  // ========= GUARDAR EVALUACIÓN Y ESTADO DEL PLAN =========
  evaluarPlanMaqueta() {
    // Necesitamos estar editando un plan existente
    if (this.editingId == null) {
      alert(
        'No se encontró el plan que se está evaluando. Asegúrese de entrar desde "Evaluar" en el inicio.'
      );
      return;
    }

    const raw = localStorage.getItem('planes_estudio');
    if (!raw) {
      alert('No hay planes almacenados para evaluar.');
      return;
    }

    const lista: any[] = JSON.parse(raw);
    const idx = lista.findIndex((p) => p.id === this.editingId);

    if (idx === -1) {
      alert('No se encontró el plan en la lista de planes.');
      return;
    }

    // 1) Tomamos estadísticas y resultado global
    const stats = this.evalStats;
    const global = this.evalResultadoFinal;

    const evaluacion = {
      counts: stats.counts,
      porcentaje: stats.porcentaje,
      resultadoGlobal: {
        etiqueta: global.texto,   // Favorable / Mejorable / Por Definir / Desfavorable
        porcentaje: global.score, // % de favorables
      },
      detallePaginas: this.evalPaginas,
      detalleTecnico: this.evaluacionesTecnicas,
      comentarioGeneral: this.comentarioGeneralEvaluador,
    };

    // 2) Mapear resultado global -> estado del plan
    let estado = 'Solicitado';
    switch (global.texto) {
      case 'Favorable':
        estado = 'Validado';
        break;
      case 'Mejorable':
        estado = 'En revisión';
        break;
      case 'Por Definir':
      case 'Desfavorable':
        estado = 'Denegado';
        break;
    }

    // 3) Actualizar registro del plan
    const planOriginal = lista[idx];

    lista[idx] = {
      ...planOriginal,
      evaluacion,
      estado,
      comentario:
        this.comentarioGeneralEvaluador ||
        planOriginal.comentario ||
        '',
    };

    localStorage.setItem('planes_estudio', JSON.stringify(lista));

    // Actualizamos referencias internas
    this.estadoOriginal = estado;
    this.comentarioOriginal =
      this.comentarioGeneralEvaluador ||
      planOriginal.comentario ||
      '';

    alert(
      `Evaluación registrada.\nResultado global: ${global.texto} (${global.score}%).`
    );
  }
}
