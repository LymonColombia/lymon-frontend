import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapList, bootstrapXLg } from '@ng-icons/bootstrap-icons';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';

interface LyhostNavLink {
  label: string;
  sectionId: string;
}

@Component({
  selector: 'app-lyhost-nav',
  standalone: true,
  imports: [ButtonComponent, NgOptimizedImage, NgIcon],
  templateUrl: './lyhost-nav.component.html',
  styleUrl: './lyhost-nav.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [provideIcons({ bootstrapList, bootstrapXLg })],
})
export class LyhostNavComponent {
  private readonly router = inject(Router);

  readonly mobileOpen = signal(false);

  readonly links: LyhostNavLink[] = [
    { label: 'Explorar', sectionId: 'explorar' },
    { label: 'Planes', sectionId: 'planes' },
    { label: 'Características', sectionId: 'caracteristicas' },
    { label: 'Para Gestores', sectionId: 'para-gestores' },
  ];

  toggleMobileMenu(): void {
    this.mobileOpen.update((value) => !value);
  }

  closeMobileMenu(): void {
    this.mobileOpen.set(false);
  }

  goToManagerLogin(): void {
    this.router.navigate(['/login']);
  }

  goToGuestLogin(): void {
    this.router.navigate(['/guest/login']);
  }

  navigateToSection(sectionId: string): void {
    const section = document.getElementById(sectionId);

    if (!section) {
      this.closeMobileMenu();
      return;
    }

    const navOffset = 88;
    const targetPosition = section.getBoundingClientRect().top + window.scrollY - navOffset;

    window.scrollTo({
      top: Math.max(targetPosition, 0),
      behavior: 'smooth',
    });

    this.closeMobileMenu();
  }
}
