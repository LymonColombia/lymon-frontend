import {
  Directive,
  ElementRef,
  HostListener,
  inject,
  input,
  OnDestroy,
  Renderer2,
  effect,
  Signal,
  EffectRef,
} from '@angular/core';
import { TutorialService } from '@/presentation/shared/services/tutorial.service';

@Directive({
  selector: '[tutorialHighlight]',
  standalone: true,
})
export class TutorialHighlightDirective implements OnDestroy {
  private readonly el = inject(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly tutorialService = inject(TutorialService);

  readonly tutorialHighlight = input.required<number>();

  private cleanupEffect?: EffectRef;

  constructor() {
    const isActive: Signal<boolean> = this.tutorialService.isActive;
    const currentStep: Signal<number> = this.tutorialService.currentStep;
    const clickedSteps: Signal<Set<number>> = this.tutorialService.actionButtonClicked;

    this.cleanupEffect = effect(() => {
      const step = this.tutorialHighlight();
      const shouldPulse =
        isActive() && currentStep() === step && !clickedSteps().has(step);

      if (shouldPulse) {
        this.renderer.addClass(this.el.nativeElement, 'tutorial-highlight-pulse');
      } else {
        this.renderer.removeClass(
          this.el.nativeElement,
          'tutorial-highlight-pulse',
        );
      }
    });
  }

  @HostListener('click')
  onClick(): void {
    this.tutorialService.markActionButtonClicked(this.tutorialHighlight());
  }

  ngOnDestroy(): void {
    this.cleanupEffect?.destroy();
  }
}
