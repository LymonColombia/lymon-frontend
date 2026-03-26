import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapWindow,
  bootstrapDiagram3,
  bootstrapBuildingGear,
  bootstrapPeople,
  bootstrapGraphUpArrow,
  bootstrapWindowStack,
} from '@ng-icons/bootstrap-icons';

interface LyhostFeature {
  title: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-lyhost-features',
  standalone: true,
  imports: [NgIcon],
  templateUrl: './lyhost-features.component.html',
  styleUrl: './lyhost-features.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [
    provideIcons({
      bootstrapWindow,
      bootstrapDiagram3,
      bootstrapBuildingGear,
      bootstrapPeople,
      bootstrapGraphUpArrow,
      bootstrapWindowStack,
    }),
  ],
})
export class LyhostFeaturesComponent {
  readonly hoveredIndex = signal<number | null>(null);

  readonly features: LyhostFeature[] = [
    {
      title: 'Reserva Directa',
      description:
        'Reserva sin intermediarios directamente con el alojamiento. Mejor precio y comunicación directa.',
      icon: 'bootstrapWindow',
    },
    {
      title: 'Channel Manager',
      description:
        'Sincronización en tiempo real con Airbnb, Booking, Vrbo y más. Sin overbookings.',
      icon: 'bootstrapDiagram3',
    },
    {
      title: 'Gestión Centralizada',
      description:
        'Todas tus propiedades, reservas, personal y finanzas en un solo panel de control.',
      icon: 'bootstrapBuildingGear',
    },
    {
      title: 'CRM de Huéspedes',
      description:
        'Fideliza a tus huéspedes con comunicaciones personalizadas y ofertas exclusivas.',
      icon: 'bootstrapPeople',
    },
    {
      title: 'Métricas en Tiempo Real',
      description: 'Dashboards con ocupación, revenue, ADR, RevPAR y más KPIs esenciales.',
      icon: 'bootstrapGraphUpArrow',
    },
    {
      title: 'Multi-Tenant',
      description:
        'Cada cliente con su espacio aislado y seguro. Landing privada con marca propia.',
      icon: 'bootstrapWindowStack',
    },
  ];

  setHoveredIndex(index: number | null): void {
    this.hoveredIndex.set(index);
  }
}
