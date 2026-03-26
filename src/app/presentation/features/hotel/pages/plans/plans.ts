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
import { normalizePlanType, PLANS, type PlanCard, isPlanType } from './plans.data';

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
    const normalizedFromSession = normalizePlanType(fromSession);
    if (normalizedFromSession) return normalizedFromSession;

    const accessToken = this.tokenService.getAccessToken();
    if (!accessToken) {
      return null;
    }

    const fromToken = this.tryExtractPlanTypeFromJwt(accessToken);
    return normalizePlanType(fromToken);
  });

  readonly plans = PLANS;

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
        if (isPlanType(value)) {
          return value;
        }
      }

      for (const value of Object.values(payload)) {
        if (isPlanType(value)) {
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
}
