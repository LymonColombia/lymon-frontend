import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';

@Component({
  selector: 'app-lyhost-hero',
  standalone: true,
  imports: [ButtonComponent],
  templateUrl: './lyhost-hero.component.html',
  styleUrl: './lyhost-hero.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LyhostHeroComponent {
  readonly searchFocused = signal(false);

  readonly trustItems = [
    'Reserva directa',
    'Sin comisiones ocultas',
    'Soporte 24/7',
    'Mejor precio garantizado',
  ];

  setSearchFocused(value: boolean): void {
    this.searchFocused.set(value);
  }
}
