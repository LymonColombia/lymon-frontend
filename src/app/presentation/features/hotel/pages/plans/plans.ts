import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { SidebarComponent } from '@/presentation/shared/components/sidebar/sidebar';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { TokenService } from '@/infrastructure/services/token.service';
import { UserSessionService } from '@/infrastructure/services/user-session.service';
import { PlanType } from '@/domain/entities/auth.model';

interface PlanCard {
  type: PlanType;
  name: string;
  subtitle: string;
  price: string;
  priceSuffix?: string;
  description: string;
  highlights: string[];
}

@Component({
  selector: 'app-plans',
  standalone: true,
  imports: [SidebarComponent, ButtonComponent],
  templateUrl: './plans.html',
  styleUrls: ['./plans.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlansComponent {
  private readonly tokenService = inject(TokenService);
  private readonly userSession = inject(UserSessionService);

  readonly currentPlanType = computed<PlanType | null>(() => {
    const fromSession = this.userSession.currentUser()?.planType;
    if (fromSession) {
      return this.normalizePlanType(fromSession);
    }

    const accessToken = this.tokenService.getAccessToken();
    if (!accessToken) {
      return null;
    }

    const fromToken = this.tryExtractPlanTypeFromJwt(accessToken);
    return fromToken ? this.normalizePlanType(fromToken) : null;
  });

  readonly plans: PlanCard[] = [
    {
      type: 'TRIAL',
      name: 'Plan Básico (Trial)',
      subtitle: 'Soporte Reactivo',
      price: '$55.000',
      priceSuffix: '/mes',
      description: 'Atendemos cuando ocurre el problema.',
      highlights: ['Soporte remoto', 'Respuesta reactiva', 'Cobertura de software estándar'],
    },
    {
      type: 'PLUS',
      name: 'Plan Profesional',
      subtitle: 'Soporte Preventivo',
      price: '$95.000',
      priceSuffix: '/mes',
      description: 'Reducimos fallas antes de que afecten la operación.',
      highlights: ['Incluye lo del Básico', 'Mantenimiento preventivo', 'Mejoras de estabilidad'],
    },
    {
      type: 'PRIME',
      name: 'Plan Empresarial',
      subtitle: 'Gestión Integral',
      price: '$160.000',
      priceSuffix: '/mes',
      description: 'Nos encargamos de la tecnología de sus equipos.',
      highlights: ['Incluye lo del Profesional', 'Gestión integral', 'Acompañamiento dedicado'],
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

  onChangePlan(): void {
  }

  onUpdatePlan(): void {
  }

  private normalizePlanType(planType: PlanType): PlanType {
    if (planType === 'LYMON_ONE') {
      return 'TRIAL';
    }

    return planType;
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
    return value === 'LYMON_ONE' || value === 'PLUS' || value === 'PRIME' || value === 'TRIAL';
  }
}
