import { Component } from '@angular/core';
import {
  HotelPageActionsDirective,
  HotelPageLayoutComponent,
} from '@/presentation/features/hotel/components/hotel-page-layout/hotel-page-layout';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapEnvelope,
  bootstrapEnvelopeAt,
  bootstrapPlusLg,
  bootstrapCheckLg,
  bootstrapSend,
  bootstrapCalendar,
  bootstrapEye,
  bootstrapPencilSquare,
  bootstrapTrash3,
  bootstrapXCircleFill,
  bootstrapInfoCircle,
} from '@ng-icons/bootstrap-icons';

interface Metric {
  label: string;
  value: string;
  subtitle: string;
  icon: string;
  color: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  trigger: string;
  active: boolean;
  icon: string;
  content: string;
}

interface Variable {
  name: string;
  code: string;
}

@Component({
  selector: 'app-email-config',
  imports: [HotelPageLayoutComponent, HotelPageActionsDirective, NgIcon],
  providers: [
    provideIcons({
      bootstrapEnvelope,
      bootstrapEnvelopeAt,
      bootstrapPlusLg,
      bootstrapCheckLg,
      bootstrapSend,
      bootstrapCalendar,
      bootstrapEye,
      bootstrapPencilSquare,
      bootstrapTrash3,
      bootstrapXCircleFill,
      bootstrapInfoCircle,
    }),
  ],
  templateUrl: './emailConfig.html',
  styleUrl: './emailConfig.css',
})
export class EmailConfigComponent {
  showModal = false;
  showPreviewModal = false;
  selectedTemplate: EmailTemplate | null = null;

  metrics: Metric[] = [
    {
      label: 'Plantillas Totales',
      value: '3',
      subtitle: 'Configuradas',
      icon: 'mail',
      color: '#009A44',
    },
    {
      label: 'Plantillas Activas',
      value: '3',
      subtitle: 'Enviándose automáticamente',
      icon: 'check',
      color: '#6CC24A',
    },
    {
      label: 'Correos Enviados (Mes)',
      value: '247',
      subtitle: 'Este mes',
      icon: 'send',
      color: '#6CC24A',
    },
  ];

  templates: EmailTemplate[] = [
    {
      id: '1',
      name: 'Correo de Bienvenida',
      subject: '¡Bienvenido a {NOMBRE_HOTEL}!',
      trigger: 'Al confirmar la reserva',
      active: true,
      icon: 'mail',
      content: `Estimado/a {NOMBRE_HUESPED},

¡Gracias por elegir {NOMBRE_HOTEL}! Nos complace confirmar su reserva.

Detalles de su reserva:
- Habitación: {NUMERO_HABITACION}
- Check-in: {FECHA_CHECKIN}
- Check-out: {FECHA_CHECKOUT}
- Número de huéspedes: {NUM_HUESPEDES}

Estamos ansiosos por recibirle y hacer de su estancia una experiencia memorable.

Atentamente,
El equipo de {NOMBRE_HOTEL}`,
    },
    {
      id: '2',
      name: 'Instrucciones de Llegada',
      subject: 'Instrucciones para su llegada - {NOMBRE_HOTEL}',
      trigger: '24 horas antes del check-in',
      active: true,
      icon: 'mail',
      content: `Estimado/a {NOMBRE_HUESPED},

Su llegada está programada para mañana a las {HORA_CHECKIN}. Aquí están los detalles que necesita:

Dirección: {DIRECCION_HOTEL}
Teléfono: {TELEFONO_HOTEL}
Código de acceso: {CODIGO_ACCESO}

¡Esperamos verle pronto!

Atentamente,
El equipo de {NOMBRE_HOTEL}`,
    },
    {
      id: '3',
      name: 'Encuesta de Satisfacción',
      subject: 'Comparte tu experiencia en {NOMBRE_HOTEL}',
      trigger: 'Después del check-out',
      active: true,
      icon: 'mail',
      content: `Estimado/a {NOMBRE_HUESPED},

Gracias por hospedarse con nosotros en {NOMBRE_HOTEL}.

Nos encantaría conocer su opinión sobre su estancia. Por favor, tómese un momento para completar nuestra breve encuesta.

Su opinión es muy valiosa para nosotros.

Atentamente,
El equipo de {NOMBRE_HOTEL}`,
    },
  ];

  variables: Variable[] = [
    { name: 'Nombre Huésped', code: '{NOMBRE_HUESPED}' },
    { name: 'Nombre Hotel', code: '{NOMBRE_HOTEL}' },
    { name: 'Número Habitación', code: '{NUMERO_HABITACION}' },
    { name: 'Fecha Check-in', code: '{FECHA_CHECKIN}' },
    { name: 'Fecha Check-out', code: '{FECHA_CHECKOUT}' },
    { name: 'Hora Check-in', code: '{HORA_CHECKIN}' },
    { name: 'Número Huéspedes', code: '{NUM_HUESPEDES}' },
    { name: 'Dirección Hotel', code: '{DIRECCION_HOTEL}' },
    { name: 'Teléfono Hotel', code: '{TELEFONO_HOTEL}' },
    { name: 'Código Acceso', code: '{CODIGO_ACCESO}' },
  ];

  openModal(): void {
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  viewTemplate(id: string): void {
    const template = this.templates.find((t) => t.id === id);
    if (template) {
      this.selectedTemplate = template;
      this.showPreviewModal = true;
    }
  }

  closePreviewModal(): void {
    this.showPreviewModal = false;
    this.selectedTemplate = null;
  }

  sendTestEmail(id: string): void {
    console.log('Enviar correo de prueba:', id);
  }

  editTemplate(id: string): void {
    console.log('Editar plantilla:', id);
  }

  deleteTemplate(id: string): void {
    console.log('Eliminar plantilla:', id);
  }

  toggleTemplate(template: EmailTemplate): void {
    template.active = !template.active;
    console.log(`Plantilla ${template.name} ${template.active ? 'activada' : 'desactivada'}`);
  }

  insertVariable(code: string): void {
    console.log('Insertar variable:', code);
  }

  saveTemplate(): void {
    console.log('Guardar plantilla');
    this.closeModal();
  }

  getFormattedContent(content: string): string {
    // Reemplazar saltos de línea con <br>
    let formatted = content.replace(/\n/g, '<br>');

    // Resaltar variables entre llaves con un span estilizado
    formatted = formatted.replace(/\{([A-Z_]+)\}/g, '<span class="variable-highlight">{$1}</span>');

    return formatted;
  }
}
