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
import { normalizePlanType, LYHOST_PLANS, type LyhostPlan, isPlanType } from '@/domain/entities/lyhost-plan.model';

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
  private readonly planOrder: PlanType[] = ['TRIAL', 'LYMON_ONE', 'PLUS', 'PRIME'];

  readonly selectedPlan = signal<LyhostPlan | null>(null);
  readonly isChangePlanModalOpen = signal(false);
  readonly changePlanStep = signal<1 | 2 | 3 | 4>(1);
  readonly selectedTargetPlanType = signal<PlanType | null>(null);
  readonly isProcessingPayment = signal(false);
  readonly simulatedCurrentPlanType = signal<PlanType | null>(null);

  private readonly resolvedCurrentPlanType = computed<PlanType | null>(() => {
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

  readonly currentPlanType = computed<PlanType | null>(() =>
    this.simulatedCurrentPlanType() ?? this.resolvedCurrentPlanType(),
  );

  readonly plans = LYHOST_PLANS;

  readonly currentPlanLabel = computed(() => {
    const current = this.currentPlanType();
    if (!current) return '—';

    const match = this.plans.find((p) => p.type === current);
    return match?.name ?? current;
  });

  readonly selectedTargetPlan = computed<LyhostPlan | null>(() => {
    const targetType = this.selectedTargetPlanType();
    if (!targetType) return null;
    return this.plans.find((plan) => plan.type === targetType) ?? null;
  });

  readonly currentPlan = computed<LyhostPlan | null>(() => {
    const currentType = this.currentPlanType();
    if (!currentType) return null;
    return this.plans.find((plan) => plan.type === currentType) ?? null;
  });

  readonly planChangeDirection = computed<'upgrade' | 'downgrade' | 'same'>(() => {
    const current = this.currentPlanType();
    const target = this.selectedTargetPlanType();
    if (!current || !target || current === target) return 'same';

    return this.getPlanRank(target) > this.getPlanRank(current) ? 'upgrade' : 'downgrade';
  });

  readonly gainedBenefits = computed<string[]>(() => {
    const current = this.currentPlan();
    const target = this.selectedTargetPlan();
    if (!target) return [];

    const currentItems = new Set((current?.detailsSections ?? []).flatMap((section) => section.items));
    return target.detailsSections
      .flatMap((section) => section.items)
      .filter((item) => !currentItems.has(item));
  });

  readonly lostBenefits = computed<string[]>(() => {
    const current = this.currentPlan();
    const target = this.selectedTargetPlan();
    if (!current || !target) return [];

    const targetItems = new Set(target.detailsSections.flatMap((section) => section.items));
    return current.detailsSections
      .flatMap((section) => section.items)
      .filter((item) => !targetItems.has(item));
  });

  isCurrent(planType: PlanType): boolean {
    return this.currentPlanType() === planType;
  }

  isTargetPlan(planType: PlanType): boolean {
    return this.selectedTargetPlanType() === planType;
  }

  openPlanDetails(plan: LyhostPlan): void {
    this.selectedPlan.set(plan);
  }

  closePlanDetails(): void {
    this.selectedPlan.set(null);
  }

  onChangePlan(): void {
    const fallback = this.plans.find((plan) => plan.type !== this.currentPlanType()) ?? null;
    this.selectedTargetPlanType.set(fallback?.type ?? null);
    this.changePlanStep.set(1);
    this.isProcessingPayment.set(false);
    this.isChangePlanModalOpen.set(true);
  }

  onUpdatePlan(): void {
  }

  closeChangePlanModal(): void {
    this.isChangePlanModalOpen.set(false);
    this.changePlanStep.set(1);
    this.isProcessingPayment.set(false);
    this.selectedTargetPlanType.set(null);
  }

  chooseTargetPlan(planType: PlanType): void {
    if (this.isCurrent(planType)) return;
    this.selectedTargetPlanType.set(planType);
  }

  goToStep(step: 1 | 2 | 3 | 4): void {
    this.changePlanStep.set(step);
  }

  proceedFromStepOne(): void {
    if (!this.selectedTargetPlan()) return;
    this.changePlanStep.set(2);
  }

  proceedFromStepTwo(): void {
    if (!this.selectedTargetPlan()) return;
    this.changePlanStep.set(3);
  }

  simulatePaymentConfirmation(): void {
    if (this.isProcessingPayment()) return;

    this.isProcessingPayment.set(true);
    window.setTimeout(() => {
      const targetType = this.selectedTargetPlanType();
      if (targetType) {
        this.simulatedCurrentPlanType.set(targetType);
      }

      this.isProcessingPayment.set(false);
      this.changePlanStep.set(4);
    }, 1200);
  }

  private getPlanRank(planType: PlanType): number {
    return this.planOrder.indexOf(planType);
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
