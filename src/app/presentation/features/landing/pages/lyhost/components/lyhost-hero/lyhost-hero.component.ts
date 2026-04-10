import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapSearch } from '@ng-icons/bootstrap-icons';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';

@Component({
  selector: 'app-lyhost-hero',
  standalone: true,
  imports: [ButtonComponent, NgIcon],
  viewProviders: [provideIcons({ bootstrapSearch })],
  templateUrl: './lyhost-hero.component.html',
  styleUrl: './lyhost-hero.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LyhostHeroComponent {
  private readonly router = inject(Router);

  readonly trustItems = [
    'Reserva directa',
    'Sin comisiones ocultas',
    'Soporte 24/7',
    'Mejor precio garantizado',
  ];

  goToBooking(): void {
    this.router.navigate(['/booking']);
  }
}
