import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// Librerías PDF
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export type EstadoPlan =
  | 'Solicitado'
  | 'En revisión'
  | 'Denegado'
  | 'Validado';

export interface ResultadoGlobalEval {
  etiqueta: 'Favorable' | 'Mejorable' | 'Por Definir' | 'Desfavorable';
  porcentaje: number;
}

export interface EvaluacionPlan {
  counts?: any;
  porcentaje?: any;
  resultadoGlobal?: ResultadoGlobalEval;
}

export interface PlanEstudio {
  id: number;
  facultad: string;
  nombrePlan: string;
  nivel: string;
  fechaCreacion: string;
  estado: EstadoPlan;
  comentario?: string;
  detalle?: any;
  evaluacion?: EvaluacionPlan;
}

@Component({
  selector: 'app-plan-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './plan-list.html',
  styleUrls: ['./plan-list.css'],
})
export class PlanListComponent implements OnInit {
  private planesRaw: any[] = [];
  planes: PlanEstudio[] = [];
  filtro = '';

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.cargarPlanes();
  }

  cargarPlanes(): void {
    const raw = localStorage.getItem('planes_estudio');
    if (!raw) {
      this.planesRaw = [];
      this.planes = [];
      return;
    }

    this.planesRaw = JSON.parse(raw);

    this.planes = this.planesRaw.map((p: any): PlanEstudio => {
      let estado: EstadoPlan = 'Solicitado';
      const estadoRaw = (p.estado || '').toString().toLowerCase();

      if (estadoRaw === 'validado') estado = 'Validado';
      else if (estadoRaw === 'denegado') estado = 'Denegado';
      else if (estadoRaw === 'en revisión' || estadoRaw === 'en revision') {
        estado = 'En revisión';
      }

      // Si existe evaluación, el resultado global manda sobre el estado
      const evalObj: EvaluacionPlan | undefined = p.evaluacion;
      const resGlobal = evalObj?.resultadoGlobal;

      if (resGlobal?.etiqueta) {
        const etiqueta = resGlobal.etiqueta;

        if (etiqueta === 'Favorable') {
          // Aprobado → Favorable
          estado = 'Validado';
        } else if (etiqueta === 'Mejorable') {
          estado = 'En revisión';
        } else if (etiqueta === 'Por Definir' || etiqueta === 'Desfavorable') {
          estado = 'Denegado';
        }
      }

      return {
        id: p.id,
        facultad: p.facultad || '',
        nombrePlan: p.nombrePlan || '',
        nivel: p.nivel || '',
        fechaCreacion: p.fechaCreacion || new Date().toISOString(),
        estado,
        comentario: p.comentario ?? '',
        detalle: p.detalle ?? {},
        evaluacion: p.evaluacion,
      };
    });
  }

  guardarPlanes(): void {
    const actualizada = this.planesRaw.map((orig) => {
      const planoVista = this.planes.find((p) => p.id === orig.id);
      if (!planoVista) return orig;

      return {
        ...orig,
        estado: planoVista.estado,
        comentario: planoVista.comentario ?? orig.comentario ?? '',
      };
    });

    this.planesRaw = actualizada;
    localStorage.setItem('planes_estudio', JSON.stringify(actualizada));
  }

  /** Texto que el usuario ve como estado (Favorable, etc.) */
  private getEstadoVisual(p: PlanEstudio): string {
    const etiqueta = p.evaluacion?.resultadoGlobal?.etiqueta;
    return etiqueta || p.estado;
  }

  get planesFiltrados(): PlanEstudio[] {
    const f = this.filtro.toLowerCase().trim();
    if (!f) return this.planes;

    return this.planes.filter((p) => {
      const estadoVisual = this.getEstadoVisual(p).toLowerCase();
      return (
        p.facultad.toLowerCase().includes(f) ||
        p.nombrePlan.toLowerCase().includes(f) ||
        p.nivel.toLowerCase().includes(f) ||
        estadoVisual.includes(f)
      );
    });
  }

  onComentarioBlur(plan: PlanEstudio): void {
    // La lógica interna sigue siendo por estado (Denegado ↔ Desfavorable)
    if (plan.estado === 'Denegado') {
      this.guardarPlanes();
    }
  }

  eliminarPlan(plan: PlanEstudio): void {
    if (!confirm('¿Eliminar plan?')) return;

    this.planes = this.planes.filter((p) => p.id !== plan.id);
    this.planesRaw = this.planesRaw.filter((p) => p.id !== plan.id);
    this.guardarPlanes();
  }

  /** ✏️ Editar plan desde la tabla */
  editarPlan(plan: PlanEstudio): void {
    const raw = localStorage.getItem('planes_estudio');
    const lista: any[] = raw ? JSON.parse(raw) : [];

    const encontrado = lista.find((p) => p.id === plan.id);
    if (!encontrado) {
      alert('No se encontró el plan en el almacenamiento local.');
      return;
    }

    // Guardamos el plan a editar (igual que en el dashboard)
    localStorage.setItem('plan_en_edicion', JSON.stringify(encontrado));

    // Usar EXACTAMENTE la misma ruta que en dashboard-home.ts
    this.router.navigate(['/dashboard/planes-nuevo'], {
      queryParams: { id: plan.id },
    });
  }

  // =====================================================
  //              📄 GENERAR PDF ORGANIZADO
  // =====================================================

  descargarPlan(plan: PlanEstudio): void {
    // Sigue funcionando con estados internos:
    // Favorable → Validado, Mejorable → En revisión.
    if (plan.estado !== 'Validado' && plan.estado !== 'En revisión') {
      alert(
        'Solo se pueden descargar planes Validados o En revisión (resultado global Favorable o Mejorable).'
      );
      return;
    }

    const doc = new jsPDF();
    let y = 20;

    const marginLeft = 15;
    const maxWidth = 180;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(`Plan de Estudio: ${plan.nombrePlan}`, marginLeft, y);
    y += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Facultad: ${plan.facultad}`, marginLeft, y);
    y += 6;
    doc.text(`Nivel: ${plan.nivel}`, marginLeft, y);
    y += 6;
    doc.text(
      `Fecha de creación: ${new Date(
        plan.fechaCreacion
      ).toLocaleDateString()}`,
      marginLeft,
      y
    );
    y += 6;

    const resGlobal = plan.evaluacion?.resultadoGlobal;
    if (resGlobal) {
      doc.text(
        `Resultado global: ${resGlobal.etiqueta} (${resGlobal.porcentaje}%)`,
        marginLeft,
        y
      );
      y += 10;
    } else {
      y += 4;
    }

    const det = plan.detalle ?? {};
    const p0 = det.parametrosIniciales ?? {};

    const introObj = det.introduccion ?? {};
    const textoIntroduccion =
      typeof introObj === 'string' ? introObj : introObj.introduccion ?? '—';

    const descObj = det.descripcion ?? {};
    let areaDisc = '';
    let areaConoc = '';
    let duracion = '';
    let plazas = '';
    let descTextoLargo = '';

    if (typeof descObj === 'string') {
      descTextoLargo = descObj;
    } else if (typeof descObj === 'object') {
      areaDisc = descObj.areaDisciplinaria ?? descObj.areaDisc ?? '';
      areaConoc = descObj.areaConocimiento ?? descObj.areaConoc ?? '';
      duracion = descObj.duracion ?? descObj.duracionPeriodos ?? '';
      plazas = descObj.numeroPlazas ?? descObj.plazas ?? '';
      descTextoLargo =
        descObj.descripcionLarga ?? descObj.descripcion ?? '';
    }

    const justObj = det.justificacion ?? {};
    const textoJustificacion =
      typeof justObj === 'string'
        ? justObj
        : justObj.justificacion ?? det.justificacionTexto ?? '—';

    const bienObj = det.bienestar ?? {};
    const textoBienestar =
      typeof bienObj === 'string'
        ? bienObj
        : bienObj.bienestar ?? det.gestionBienestar ?? '—';

    const compObj = det.competencias ?? {};
    const textoCompFund =
      typeof det.competenciasFundamentales === 'string'
        ? det.competenciasFundamentales
        : typeof compObj === 'string'
        ? compObj
        : compObj.fundamentales ?? compObj.compFund ?? '—';

    const textoCompEspec =
      typeof det.competenciasEspecificas === 'string'
        ? det.competenciasEspecificas
        : typeof compObj === 'string'
        ? compObj
        : compObj.especificas ?? compObj.compEspec ?? '—';

    const periodos = det.planificacionCurricular?.periodos ?? [];

    // 1. Parámetros iniciales
    y = this.iniciarSeccion(doc, '1. Parámetros Iniciales', y, marginLeft);

    doc.setFontSize(11);
    doc.text(`Título: ${p0.tituloPlan ?? '—'}`, marginLeft, y);
    y += 6;
    doc.text(`Escuela: ${p0.escuela ?? '—'}`, marginLeft, y);
    y += 6;
    doc.text(`Modalidad: ${p0.modalidad ?? '—'}`, marginLeft, y);
    y += 10;

    // 2. Introducción
    y = this.iniciarSeccion(doc, '2. Introducción', y, marginLeft);
    doc.setFontSize(10);
    y = this.agregarTextoLargo(doc, textoIntroduccion, marginLeft, y, maxWidth);

    // 3. Descripción
    y = this.iniciarSeccion(doc, '3. Descripción del Programa', y, marginLeft);
    doc.setFontSize(10);

    if (areaDisc || areaConoc || duracion || plazas) {
      if (areaDisc) {
        doc.text(`Área disciplinaria: ${areaDisc}`, marginLeft, y);
        y += 5;
      }
      if (areaConoc) {
        doc.text(`Área de conocimiento: ${areaConoc}`, marginLeft, y);
        y += 5;
      }
      if (duracion) {
        doc.text(`Duración (períodos): ${duracion}`, marginLeft, y);
        y += 5;
      }
      if (plazas) {
        doc.text(`Número de plazas: ${plazas}`, marginLeft, y);
        y += 7;
      }
    }

    if (descTextoLargo) {
      y = this.agregarTextoLargo(doc, descTextoLargo, marginLeft, y, maxWidth);
    } else if (!areaDisc && !areaConoc && !duracion && !plazas) {
      doc.text('—', marginLeft, y);
      y += 6;
    }

    // 4. Justificación
    y = this.iniciarSeccion(doc, '4. Justificación', y, marginLeft);
    doc.setFontSize(10);
    y = this.agregarTextoLargo(doc, textoJustificacion, marginLeft, y, maxWidth);

    // 5. Gestión y Bienestar
    y = this.iniciarSeccion(
      doc,
      '5. Gestión y Bienestar Estudiantil',
      y,
      marginLeft
    );
    doc.setFontSize(10);
    y = this.agregarTextoLargo(doc, textoBienestar, marginLeft, y, maxWidth);

    // 6. Competencias
    y = this.iniciarSeccion(doc, '6. Competencias', y, marginLeft);
    doc.setFontSize(10);

    y = this.agregarTextoLargo(
      doc,
      `Competencias fundamentales:\n${textoCompFund}`,
      marginLeft,
      y,
      maxWidth
    );

    y += 4;

    y = this.agregarTextoLargo(
      doc,
      `Competencias específicas:\n${textoCompEspec}`,
      marginLeft,
      y,
      maxWidth
    );

    // 7. Planificación Curricular
    doc.addPage();
    y = 20;

    y = this.iniciarSeccion(
      doc,
      '7. Planificación Curricular',
      y,
      marginLeft
    );
    y += 2;

    periodos.forEach((p: any) => {
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginBottom = 20;

      if (y + 30 > pageHeight - marginBottom) {
        doc.addPage();
        y = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`Semestre ${p.numero}`, marginLeft, y);
      y += 6;

      // TABLA + TOTALES SEMESTRE
      const body: any[] = [];

      let totalCreditos = 0;
      let totalHT = 0;
      let totalHP = 0;

      (p.asignaturas || []).forEach((a: any) => {
        const ht = Number(a.ht) || 0;
        const hp = Number(a.hp) || 0;

        const creditos =
          typeof a.creditos === 'number' && !isNaN(a.creditos)
            ? a.creditos
            : ht + hp;

        totalCreditos += creditos;
        totalHT += ht;
        totalHP += hp;

        body.push([
          a.codigo || '',
          a.nombre || '',
          creditos,
          ht,
          hp,
          a.componenteFormacion || '',
        ]);
      });

      // Fila de totales del semestre
      body.push([
        {
          content: 'Total',
          colSpan: 2,
          styles: { fontStyle: 'bold' },
        },
        totalCreditos,
        totalHT,
        totalHP,
        '',
      ]);

      autoTable(doc, {
        head: [['Código', 'Asignatura', 'Créditos', 'HT', 'HP', 'Componente']],
        body,
        startY: y,
        margin: { left: marginLeft, right: marginLeft },
        theme: 'grid',
        styles: {
          fontSize: 9,
          textColor: [0, 0, 0],
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [52, 73, 94],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        columnStyles: {
          2: { halign: 'center' },
          3: { halign: 'center' },
          4: { halign: 'center' },
        },
      });

      y = (doc as any).lastAutoTable.finalY + 12;
    });

    const name = `plan_${plan.nombrePlan.replace(/\s+/g, '_').toLowerCase()}.pdf`;
    doc.save(name);
  }

  private iniciarSeccion(
    doc: any,
    titulo: string,
    y: number,
    marginLeft: number
  ): number {
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginTop = 20;
    const marginBottom = 20;

    if (y + 20 > pageHeight - marginBottom) {
      doc.addPage();
      y = marginTop;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(titulo, marginLeft, y);
    y += 3;

    doc.setDrawColor(180);
    doc.setLineWidth(0.3);
    doc.line(marginLeft, y, 200 - marginLeft, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    return y;
  }

  private agregarTextoLargo(
    doc: any,
    texto: string,
    x: number,
    y: number,
    maxWidth: number
  ): number {
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginTop = 20;
    const marginBottom = 20;

    const lines = doc.splitTextToSize(texto || '—', maxWidth);

    lines.forEach((line: string) => {
      if (y > pageHeight - marginBottom) {
        doc.addPage();
        y = marginTop;
      }
      doc.text(line, x, y);
      y += 5;
    });

    return y + 3;
  }
}
