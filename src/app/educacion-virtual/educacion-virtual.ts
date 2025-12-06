// src/app/educacion-virtual/educacion-virtual.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface RecursoVirtual {
  nombre: string;
  cantidad: number | null;
  area: string;
  disponible: boolean | null;
}

// jsPDF global (y autoTable desde el plugin)
declare const jsPDF: any;

@Component({
  selector: 'app-educacion-virtual',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './educacion-virtual.html',
  styleUrls: ['./educacion-virtual.css'],
})
export class EducacionVirtualComponent implements OnInit {
  private readonly STORAGE_INFRA = 'educacion_virtual_infraestructura';
  private readonly STORAGE_AUDIO = 'educacion_virtual_recursos_audio';

  recursosInfraestructura: RecursoVirtual[] = [
    { nombre: 'Datashow', cantidad: null, area: '', disponible: null },
    { nombre: 'Pizarras Digitales', cantidad: null, area: '', disponible: null },
    { nombre: 'Sala de Videoconferencia', cantidad: null, area: '', disponible: null },
    { nombre: 'Simuladores', cantidad: null, area: '', disponible: null },
    { nombre: 'Bibliotecas virtuales', cantidad: null, area: '', disponible: null },
    { nombre: 'Base de datos de libros', cantidad: null, area: '', disponible: null },
    { nombre: 'Base de datos de tesis', cantidad: null, area: '', disponible: null },
    { nombre: 'Recursos multimedia', cantidad: null, area: '', disponible: null },
    { nombre: 'Repositorios de contenidos', cantidad: null, area: '', disponible: null },
    { nombre: 'Repositorio de software', cantidad: null, area: '', disponible: null },
  ];

  recursosAudiovisuales: RecursoVirtual[] = [];

  ngOnInit(): void {
    // inicializamos audiovisuales con la misma lista
    this.recursosAudiovisuales = this.recursosInfraestructura.map((r) => ({
      ...r,
    }));

    this.cargar();
  }

  private cargar() {
    const infra = localStorage.getItem(this.STORAGE_INFRA);
    if (infra) {
      this.recursosInfraestructura = JSON.parse(infra) as RecursoVirtual[];
    }

    const audio = localStorage.getItem(this.STORAGE_AUDIO);
    if (audio) {
      this.recursosAudiovisuales = JSON.parse(audio) as RecursoVirtual[];
    }
  }

  private guardarInfraestructuraStorage() {
    localStorage.setItem(
      this.STORAGE_INFRA,
      JSON.stringify(this.recursosInfraestructura)
    );
  }

  private guardarAudioStorage() {
    localStorage.setItem(
      this.STORAGE_AUDIO,
      JSON.stringify(this.recursosAudiovisuales)
    );
  }

  guardarInfraestructura() {
    this.guardarInfraestructuraStorage();
    alert('Infraestructura tecnológica guardada correctamente.');
  }

  guardarAudiovisuales() {
    this.guardarAudioStorage();
    alert('Recursos audiovisuales guardados correctamente.');
  }

  // ==========================
  // REPORTE PDF
  // ==========================
  imprimirReporteEducacionVirtual(): void {
    console.log('[Educación Virtual] Click en imprimir reporte');

    if (typeof jsPDF === 'undefined' || !jsPDF) {
      alert(
        'jsPDF no está cargado. Revisa los <script> de jsPDF y autoTable en index.html.'
      );
      return;
    }

    const doc = new jsPDF('l', 'pt', 'a4');
    doc.setFontSize(14);
    doc.text(
      'Educación Virtual - Infraestructura y Recursos Audiovisuales',
      40,
      40
    );

    if (!(doc as any).autoTable) {
      alert(
        'jsPDF.autoTable no está disponible. Falta el script de jspdf-autotable en index.html.'
      );
      return;
    }

    // Tabla 1: Infraestructura
    const bodyInfra = this.recursosInfraestructura.map((r) => [
      r.nombre,
      r.cantidad ?? 0,
      r.area || '',
      r.disponible === null ? 'N/D' : r.disponible ? 'Sí' : 'No',
    ]);

    (doc as any).autoTable({
      head: [['Recurso', 'Cantidad', 'Área', 'Disponible']],
      body: bodyInfra,
      startY: 60,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [47, 111, 228] },
      theme: 'grid',
    });

    const finalY = (doc as any).lastAutoTable.finalY || 60;

    // Tabla 2: Audiovisuales
    const bodyAudio = this.recursosAudiovisuales.map((r) => [
      r.nombre,
      r.cantidad ?? 0,
      r.area || '',
      r.disponible === null ? 'N/D' : r.disponible ? 'Sí' : 'No',
    ]);

    (doc as any).autoTable({
      head: [['Recurso audiovisual', 'Cantidad', 'Área', 'Disponible']],
      body: bodyAudio,
      startY: finalY + 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [76, 175, 80] },
      theme: 'grid',
    });

    doc.save('reporte-educacion-virtual.pdf');
  }
}
