import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';

interface LyhostPlan {
  name: string;
  price: string;
  description: string;
  properties: string;
  features: string[];
  highlighted: boolean;
}

@Component({
  selector: 'app-lyhost-plans',
  standalone: true,
  imports: [ButtonComponent],
  templateUrl: './lyhost-plans.component.html',
  styleUrl: './lyhost-plans.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LyhostPlansComponent {
  readonly annual = signal(true);

  readonly plans: LyhostPlan[] = [
    {
      name: 'Starter',
      price: '49',
      description: 'Para propietarios con pocas propiedades',
      properties: 'Hasta 5 propiedades',
      features: [
        'Channel Manager básico',
        'Calendario unificado',
        'Landing de reservas',
        'Soporte por email',
        'Métricas básicas',
      ],
      highlighted: false,
    },
    {
      name: 'Profesional',
      price: '129',
      description: 'Para gestores que escalan su negocio',
      properties: 'Hasta 25 propiedades',
      features: [
        'Channel Manager avanzado',
        'CRM de huéspedes',
        'Precios dinámicos',
        'API de integración',
        'Reportes avanzados',
        'Soporte prioritario',
        'Landing con marca propia',
      ],
      highlighted: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'Para cadenas y grandes operaciones',
      properties: 'Propiedades ilimitadas',
      features: [
        'Todo en Profesional',
        'Multi-usuario con roles',
        'SLA garantizado',
        'Integraciones custom',
        'Account manager dedicado',
        'Onboarding personalizado',
      ],
      highlighted: false,
    },
  ];

  setAnnual(value: boolean): void {
    this.annual.set(value);
  }

  getDisplayedPrice(price: string): string {
    if (price === 'Custom') {
      return 'Custom';
    }

    const numericPrice = Number(price);
    if (Number.isNaN(numericPrice)) {
      return price;
    }

    const adjustedPrice = this.annual() ? Math.round(numericPrice * 0.8) : numericPrice;
    return `€${adjustedPrice}`;
  }
}
