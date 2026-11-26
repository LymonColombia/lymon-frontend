import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonComponent } from '@/presentation/shared/components/button/button';

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

  readonly links: LyhostNavLink[] = [
    { label: 'Producto', sectionId: 'ecosistema' },
    { label: 'Módulos', sectionId: 'caracteristicas' },
    { label: 'Planes', sectionId: 'planes' },
  ];

  goTo(path: string): void {
    this.router.navigate([path]);
  }

  scrollTo(sectionId: string): void {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  }
}
