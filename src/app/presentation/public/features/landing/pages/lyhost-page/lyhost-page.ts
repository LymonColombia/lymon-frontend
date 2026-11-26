import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { DOCUMENT, NgOptimizedImage } from '@angular/common';
import { Router } from '@angular/router';
import { LYHOST_LANG, landingText } from './i18n/lyhost-i18n';
import { ButtonComponent } from '@/presentation/shared/components/button/button';
import { LyhostNavComponent } from './components/lyhost-nav/lyhost-nav';
import { LyhostHeroComponent } from './components/lyhost-hero/lyhost-hero';
import { PlansComponent } from './components/lyhost-plans/lyhost-plans';
import { LyhostFeaturesComponent } from './components/lyhost-features/lyhost-features';
import { LyhostEcosystemComponent } from './components/lyhost-ecosystem/lyhost-ecosystem';

@Component({
  selector: 'app-lyhost-page',
  imports: [
    ButtonComponent,
    NgOptimizedImage,
    LyhostNavComponent,
    LyhostHeroComponent,
    LyhostEcosystemComponent,
    LyhostFeaturesComponent,
    PlansComponent,
  ],
  templateUrl: './lyhost-page.html',
  styleUrls: ['./lyhost-theme.css', './lyhost-page.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LyhostPageComponent {
  private readonly router = inject(Router);
  readonly nav = landingText('nav');
  readonly close = landingText('close');
  readonly footer = landingText('footer');

  constructor() {
    // Tell browsers and screen readers which language the page is in; restore the app's own on leave
    const root = inject(DOCUMENT).documentElement;
    const previous = root.lang;
    root.lang = inject(LYHOST_LANG);
    inject(DestroyRef).onDestroy(() => (root.lang = previous));
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  scrollTo(sectionId: string): void {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  }
}
