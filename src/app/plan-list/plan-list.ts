// src/app/plan-list/plan-list.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

// Librerías PDF
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export type EstadoPlan =
  | 'Solicitado'
  | 'En revisión'
  | 'Denegado'
  | 'Validado';

export interface PlanEstudio {
  id: number;
  facultad: string;
  nombrePlan: string;
  nivel: string;
  fechaCreacion: string;
  estado: EstadoPlan;
  comentario?: string;
  detalle?: any;
}

@Component({
  selector: 'app-plan-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './plan-list.html',
  styleUrls: ['./plan-list.css'],
})
export class PlanListComponent implements OnInit {
  planes: PlanEstudio[] = [];
  filtro = '';

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.cargarPlanes();
  }

  cargarPlanes(): void {
    const raw = localStorage.getItem('planes_estudio');
    if (!raw) {
      this.planes = [];
      return;
    }

    const data = JSON.parse(raw);

    this.planes = data.map((p: any) => {
      let estado: EstadoPlan = 'Solicitado';
      if (p.estado === 'Validado' || p.estado === 'validado') estado = 'Validado';
      else if (p.estado === 'Denegado' || p.estado === 'denegado') estado = 'Denegado';
      else if (p.estado === 'En revisión' || p.estado === 'revision') estado = 'En revisión';

      return {
        id: p.id,
        facultad: p.facultad,
        nombrePlan: p.nombrePlan,
        nivel: p.nivel,
        fechaCreacion: p.fechaCreacion,
        estado,
        comentario: p.comentario ?? '',
        detalle: p.detalle ?? {},
      };
    });
  }

  guardarPlanes(): void {
    localStorage.setItem('planes_estudio', JSON.stringify(this.planes));
  }

  get planesFiltrados(): PlanEstudio[] {
    const f = this.filtro.toLowerCase();
    return this.planes.filter(
      (p) =>
        p.facultad.toLowerCase().includes(f) ||
        p.nombrePlan.toLowerCase().includes(f) ||
        p.nivel.toLowerCase().includes(f) ||
        p.estado.toLowerCase().includes(f)
    );
  }

  onEstadoChange(plan: PlanEstudio, nuevoEstado: EstadoPlan): void {
    plan.estado = nuevoEstado;
    if (plan.estado !== 'Denegado') plan.comentario = '';
    this.guardarPlanes();
  }

  onComentarioBlur(plan: PlanEstudio): void {
    if (plan.estado === 'Denegado') this.guardarPlanes();
  }

  eliminarPlan(plan: PlanEstudio): void {
    if (!confirm('¿Eliminar plan?')) return;
    this.planes = this.planes.filter((p) => p.id !== plan.id);
    this.guardarPlanes();
  }

  // =====================================================
  //              📄 GENERAR PDF ORGANIZADO
  // =====================================================

  descargarPlan(plan: PlanEstudio): void {
    if (plan.estado !== 'Validado') {
      alert('Solo se pueden descargar planes validados.');
      return;
    }

    const doc = new jsPDF();
    let y = 20;

    const marginLeft = 15;
    const maxWidth = 180;

    // CABECERA
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(`Plan de Estudio: ${plan.nombrePlan}`, marginLeft, y);
    y += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Facultad: ${plan.facultad}`, marginLeft, y); y += 6;
    doc.text(`Nivel: ${plan.nivel}`, marginLeft, y); y += 6;
    doc.text(
      `Fecha de creación: ${new Date(plan.fechaCreacion).toLocaleDateString()}`,
      marginLeft,
      y
    );
    y += 10;

    const det = plan.detalle ?? {};

    // --------- Parámetros iniciales ---------
    const p0 = det.parametrosIniciales ?? {};

    // --------- Introducción ---------
    const introObj = det.introduccion ?? {};
    const textoIntroduccion =
      typeof introObj === 'string'
        ? introObj
        : introObj.introduccion ?? '—';

    // --------- Descripción (campos del paso 2) ---------
    const descObj = det.descripcion ?? {};
    let areaDisc = '';
    let areaConoc = '';
    let duracion = '';
    let plazas = '';
    let descTextoLargo = '';

    if (typeof descObj === 'string') {
      // por si alguna vez se guarda como texto plano
      descTextoLargo = descObj;
    } else if (typeof descObj === 'object') {
      areaDisc =
        descObj.areaDisciplinaria ?? descObj.areaDisc ?? '';
      areaConoc =
        descObj.areaConocimiento ?? descObj.areaConoc ?? '';
      duracion =
        descObj.duracion ?? descObj.duracionPeriodos ?? '';
      plazas =
        descObj.numeroPlazas ?? descObj.plazas ?? '';

      // si tuvieras un textarea extra de descripción larga
      descTextoLargo =
        descObj.descripcionLarga ?? descObj.descripcion ?? '';
    }

    // --------- Justificación ---------
    const justObj = det.justificacion ?? {};
    const textoJustificacion =
      typeof justObj === 'string'
        ? justObj
        : justObj.justificacion ?? det.justificacionTexto ?? '—';

    // --------- Bienestar ---------
    const bienObj = det.bienestar ?? {};
    const textoBienestar =
      typeof bienObj === 'string'
        ? bienObj
        : bienObj.bienestar ?? det.gestionBienestar ?? '—';

    // --------- Competencias ---------
    const compObj = det.competencias ?? {};
    const textoCompFund =
      typeof det.competenciasFundamentales === 'string'
        ? det.competenciasFundamentales
        : (typeof compObj === 'string'
            ? compObj
            : compObj.fundamentales ?? compObj.compFund ?? '—');

    const textoCompEspec =
      typeof det.competenciasEspecificas === 'string'
        ? det.competenciasEspecificas
        : (typeof compObj === 'string'
            ? compObj
            : compObj.especificas ?? compObj.compEspec ?? '—');

    const periodos = det.planificacionCurricular?.periodos ?? [];

    // =====================================================
    // 1. PARÁMETROS INICIALES
    // =====================================================
    y = this.iniciarSeccion(doc, '1. Parámetros Iniciales', y, marginLeft);

    doc.setFontSize(11);
    doc.text(`Título: ${p0.tituloPlan ?? '—'}`, marginLeft, y); y += 6;
    doc.text(`Escuela: ${p0.escuela ?? '—'}`, marginLeft, y); y += 6;
    doc.text(`Modalidad: ${p0.modalidad ?? '—'}`, marginLeft, y); y += 10;

    // =====================================================
    // 2. INTRODUCCIÓN
    // =====================================================
    y = this.iniciarSeccion(doc, '2. Introducción', y, marginLeft);
    doc.setFontSize(10);
    y = this.agregarTextoLargo(doc, textoIntroduccion, marginLeft, y, maxWidth);

    // =====================================================
    // 3. DESCRIPCIÓN DEL PROGRAMA
    // =====================================================
    y = this.iniciarSeccion(doc, '3. Descripción del Programa', y, marginLeft);
    doc.setFontSize(10);

    if (areaDisc || areaConoc || duracion || plazas) {
      if (areaDisc) {
        doc.text(`Área disciplinaria: ${areaDisc}`, marginLeft, y); y += 5;
      }
      if (areaConoc) {
        doc.text(`Área de conocimiento: ${areaConoc}`, marginLeft, y); y += 5;
      }
      if (duracion) {
        doc.text(`Duración (períodos): ${duracion}`, marginLeft, y); y += 5;
      }
      if (plazas) {
        doc.text(`Número de plazas: ${plazas}`, marginLeft, y); y += 7;
      }
    }

    if (descTextoLargo) {
      y = this.agregarTextoLargo(doc, descTextoLargo, marginLeft, y, maxWidth);
    } else if (!areaDisc && !areaConoc && !duracion && !plazas) {
      doc.text('—', marginLeft, y);
      y += 6;
    }

    // =====================================================
    // 4. JUSTIFICACIÓN
    // =====================================================
    y = this.iniciarSeccion(doc, '4. Justificación', y, marginLeft);
    doc.setFontSize(10);
    y = this.agregarTextoLargo(doc, textoJustificacion, marginLeft, y, maxWidth);

    // =====================================================
    // 5. GESTIÓN Y BIENESTAR ESTUDIANTIL
    // =====================================================
    y = this.iniciarSeccion(doc, '5. Gestión y Bienestar Estudiantil', y, marginLeft);
    doc.setFontSize(10);
    y = this.agregarTextoLargo(doc, textoBienestar, marginLeft, y, maxWidth);

    // =====================================================
    // 6. COMPETENCIAS
    // =====================================================
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

    // =====================================================
    // 7. PLANIFICACIÓN CURRICULAR (NUEVA PÁGINA)
    // =====================================================
    doc.addPage();
    y = 20;

    y = this.iniciarSeccion(doc, '7. Planificación Curricular', y, marginLeft);
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

      const rows = p.asignaturas.map((a: any) => [
        a.codigo,
        a.nombre,
        a.creditos,
        a.ht,
        a.hp,
        a.componenteFormacion,
      ]);

      autoTable(doc, {
        head: [['Código', 'Asignatura', 'Créditos', 'HT', 'HP', 'Componente']],
        body: rows,
        startY: y,
        margin: { left: marginLeft, right: marginLeft },
        theme: 'grid',
        styles: {
          fontSize: 9,
          textColor: [0, 0, 0],          // texto negro
          lineColor: [200, 200, 200],    // líneas suaves
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [52, 73, 94],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],    // filas alternadas en gris claro
        },
      });

      y = (doc as any).lastAutoTable.finalY + 12;
    });

    // =====================================================
    // ARCHIVO FINAL
    // =====================================================
    const name = `plan_${plan.nombrePlan.replace(/\s+/g, '_').toLowerCase()}.pdf`;
    doc.save(name);
  }

  // ================== HELPERS DE MAQUETADO ==================

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
