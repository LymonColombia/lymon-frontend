import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonComponent } from '@/presentation/shared/components/button/button';
import { landingText } from '../../i18n/lyhost-i18n';

@Component({
  selector: 'app-lyhost-plans',
  imports: [ButtonComponent],
  templateUrl: './lyhost-plans.html',
  styleUrls: ['../../lyhost-theme.css', './lyhost-plans.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlansComponent {
  private readonly router = inject(Router);

  // ponytail: landing copy is marketing text from the design (in the i18n files); checkout reads PLANS from the domain
  readonly t = landingText('plans');

  scrollTo(sectionId: string): void {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }
}
