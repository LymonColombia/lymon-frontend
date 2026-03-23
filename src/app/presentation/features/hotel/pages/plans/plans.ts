import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  HotelPageLayoutComponent,
  HotelPageMetaDirective,
} from '@/presentation/features/hotel/components/hotel-page-layout/hotel-page-layout';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapStar,
  bootstrapStarFill,
  bootstrapStarHalf,
} from '@ng-icons/bootstrap-icons';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { ModalComponent } from '@/presentation/shared/components/modal/modal.component';
import { TokenService } from '@/infrastructure/services/token.service';
import { UserSessionService } from '@/infrastructure/services/user-session.service';
import { PlanType } from '@/domain/entities/auth.model';
interface PlanDetailSection {
  title: string;
  items: string[];
}

interface PlanCard {
  type: PlanType;
  name: string;
  subtitle: string;
  price: string;
  priceSuffix?: string;
  priceNote?: string;
  detailsSections: PlanDetailSection[];
}

@Component({
  selector: 'app-plans',
  standalone: true,
  imports: [HotelPageLayoutComponent, HotelPageMetaDirective, NgIcon, ButtonComponent, ModalComponent],
  providers: [provideIcons({ bootstrapStar, bootstrapStarHalf, bootstrapStarFill })],
  templateUrl: './plans.html',
  styleUrls: ['./plans.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlansComponent {
  private readonly tokenService = inject(TokenService);
  private readonly userSession = inject(UserSessionService);

  readonly selectedPlan = signal<PlanCard | null>(null);

  readonly currentPlanType = computed<PlanType | null>(() => {
    const fromSession = this.userSession.currentUser()?.planType;
    const normalizedFromSession = this.normalizePlanType(fromSession);
    if (normalizedFromSession) return normalizedFromSession;

    const accessToken = this.tokenService.getAccessToken();
    if (!accessToken) {
      return null;
    }

    const fromToken = this.tryExtractPlanTypeFromJwt(accessToken);
    return this.normalizePlanType(fromToken);
  });

  readonly plans: PlanCard[] = [
    {
      type: 'TRIAL',
      name: 'Trial',
      subtitle: 'Prueba Lymon antes de suscribirte',
      price: '$0',
      priceNote: 'Acceso de prueba por tiempo limitado',
      detailsSections: [
        {
          title: 'CAPACIDAD',
          items: ['Hasta 1 propiedad', 'Hasta 1 usuario', 'Unidades ilimitadas'],
        },
        {
          title: 'INTEGRACIONES',
          items: ['Airbnb', 'Booking.com', 'Vrbo'],
        },
        {
          title: 'GESTIÓN',
          items: ['Multicalendario unificado', 'Inbox combinado'],
        },
      ],
    },
    {
      type: 'LYMON_ONE',
      name: 'LymonOne',
      subtitle: 'Ideal para propietarios independientes',
      price: '$89.900',
      priceSuffix: '/mes',
      priceNote: 'Pago mensual sin compromiso',
      detailsSections: [
        {
          title: 'CAPACIDAD',
          items: ['Hasta 5 propiedades', 'Hasta 2 usuarios', 'Unidades ilimitadas'],
        },
        {
          title: 'INTEGRACIONES',
          items: ['Airbnb', 'Booking.com', 'Vrbo'],
        },
        {
          title: 'GESTIÓN',
          items: ['Multicalendario unificado', 'Inbox combinado', 'Roles y turnos básicos'],
        },
      ],
    },
    {
      type: 'PLUS',
      name: 'LymonPlus',
      subtitle: 'Para administradores profesionales',
      price: '$189.900',
      priceSuffix: '/mes',
      priceNote: 'Incluye todo lo de LymonOne +',
      detailsSections: [
        {
          title: 'CAPACIDAD',
          items: ['Hasta 20 propiedades', 'Hasta 10 usuarios', 'Unidades ilimitadas'],
        },
        {
          title: 'FUNCIONES PREMIUM',
          items: ['Landing privada personalizada', 'CRM integrado', 'Turnos con biometría'],
        },
        {
          title: 'GESTIÓN AVANZADA',
          items: ['Reportes y analíticas', 'Gestión financiera básica', 'Soporte prioritario'],
        },
      ],
    },
    {
      type: 'PRIME',
      name: 'LymonPrime',
      subtitle: 'Solución completa sin límites',
      price: '$349.900',
      priceSuffix: '/mes',
      priceNote: 'Todo incluido + personalización',
      detailsSections: [
        {
          title: 'CAPACIDAD',
          items: ['Propiedades ilimitadas', 'Usuarios ilimitados', 'Unidades ilimitadas'],
        },
        {
          title: 'PREMIUM FEATURES',
          items: ['Todo lo de LymonPlus', 'API completa', 'White-label disponible'],
        },
        {
          title: 'SOPORTE ENTERPRISE',
          items: ['Account manager dedicado', 'Soporte 24/7', 'Capacitación personalizada'],
        },
      ],
    },
  ];

  readonly currentPlanLabel = computed(() => {
    const current = this.currentPlanType();
    if (!current) return '—';

    const match = this.plans.find((p) => p.type === current);
    return match?.name ?? current;
  });

  isCurrent(planType: PlanType): boolean {
    return this.currentPlanType() === planType;
  }

  openPlanDetails(plan: PlanCard): void {
    this.selectedPlan.set(plan);
  }

  closePlanDetails(): void {
    this.selectedPlan.set(null);
  }

  onChangePlan(): void {
  }

  onUpdatePlan(): void {
  }

  private normalizePlanType(value: unknown): PlanType | null {
    if (value === 'LYMON_PLUS') {
      return 'PLUS';
    }

    if (this.isPlanType(value)) {
      return value;
    }

    return null;
  }

  private tryExtractPlanTypeFromJwt(token: string): PlanType | null {
    try {
      const parts = token.split('.');
      if (parts.length < 2) {
        return null;
      }

      const payloadRaw = this.decodeBase64Url(parts[1]);
      const payload = JSON.parse(payloadRaw) as Record<string, unknown>;

      const keyCandidates = [
        'planType',
        'plan',
        'tenantPlan',
        'subscriptionPlan',
        'subscription',
        'plan_type',
      ];

      for (const key of keyCandidates) {
        const value = payload[key];
        if (this.isPlanType(value)) {
          return value;
        }
      }

      for (const value of Object.values(payload)) {
        if (this.isPlanType(value)) {
          return value;
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  private decodeBase64Url(base64Url: string): string {
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padLength = (4 - (base64.length % 4)) % 4;
    const padded = base64 + '='.repeat(padLength);
    return globalThis.atob(padded);
  }

  private isPlanType(value: unknown): value is PlanType {
    return value === 'TRIAL' || value === 'LYMON_ONE' || value === 'PLUS' || value === 'PRIME';
  }
}
