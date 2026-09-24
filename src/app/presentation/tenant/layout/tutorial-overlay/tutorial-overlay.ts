import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapHouseDoorFill,
  bootstrapBuilding,
  bootstrapBoxSeam,
  bootstrapTruck,
  bootstrapPersonFillAdd,
  bootstrapClockFill,
  bootstrapPersonCheck,
  bootstrapCalendar3,
  bootstrapPeopleFill,
  bootstrapClipboardData,
  bootstrapExclamationTriangle,
  bootstrapX,
} from '@ng-icons/bootstrap-icons';

import { TutorialService } from '@/presentation/tenant/services/tutorial.service';
import { ButtonComponent } from '@/presentation/shared/components/button/button';
import { ModalComponent } from '@/presentation/shared/components/modal/modal';

@Component({
  selector: 'app-tutorial-overlay',
  standalone: true,
  imports: [NgIcon, ButtonComponent, ModalComponent],
  providers: [
    provideIcons({
      bootstrapHouseDoorFill,
      bootstrapBuilding,
      bootstrapBoxSeam,
      bootstrapTruck,
      bootstrapPersonFillAdd,
      bootstrapClockFill,
      bootstrapPersonCheck,
      bootstrapCalendar3,
      bootstrapPeopleFill,
      bootstrapClipboardData,
      bootstrapExclamationTriangle,
      bootstrapX,
    }),
  ],
  templateUrl: './tutorial-overlay.html',
  styleUrl: './tutorial-overlay.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TutorialOverlayComponent {
  private readonly tutorialService = inject(TutorialService);

  readonly currentStep = this.tutorialService.currentStep;
  readonly totalSteps = this.tutorialService.totalSteps;
  readonly steps = this.tutorialService.steps;
  readonly isActive = this.tutorialService.isActive;

  readonly step = computed(() => this.steps[this.currentStep()]);
  readonly progress = computed(
    () => ((this.currentStep() + 1) / this.totalSteps) * 100,
  );
  readonly isLastStep = computed(
    () => this.currentStep() === this.totalSteps - 1,
  );
  readonly isActionStep = computed(() => this.step().type === 'action');
  readonly showBackButton = computed(() => this.currentStep() > 0);

  readonly showAbandonConfirm = signal(false);

  onNext(): void {
    this.tutorialService.nextStep();
  }

  onPrevious(): void {
    this.tutorialService.previousStep();
  }

  onSkip(): void {
    this.tutorialService.nextStep();
  }

  onFinish(): void {
    this.tutorialService.finish();
  }

  onAbandon(): void {
    this.showAbandonConfirm.set(true);
  }

  confirmAbandon(): void {
    this.showAbandonConfirm.set(false);
    this.tutorialService.abandon();
  }

  cancelAbandon(): void {
    this.showAbandonConfirm.set(false);
  }
}
