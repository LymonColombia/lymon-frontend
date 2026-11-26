import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonComponent } from '@/presentation/shared/components/button/button';
import { LYHOST_TEXT } from '../../i18n/lyhost-i18n';

interface LyhostNavLink {
  label: string;
  sectionId: string;
}

@Component({
  selector: 'app-lyhost-nav',
  imports: [ButtonComponent, NgOptimizedImage],
  templateUrl: './lyhost-nav.html',
  styleUrls: ['../../lyhost-theme.css', './lyhost-nav.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LyhostNavComponent {
  private readonly router = inject(Router);
  readonly t = inject(LYHOST_TEXT).nav;

  readonly links: LyhostNavLink[] = [
    { label: this.t.product, sectionId: 'ecosistema' },
    { label: this.t.modules, sectionId: 'caracteristicas' },
    { label: this.t.plans, sectionId: 'planes' },
  ];

  goTo(path: string): void {
    this.router.navigate([path]);
  }

  scrollTo(sectionId: string): void {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  }
}
