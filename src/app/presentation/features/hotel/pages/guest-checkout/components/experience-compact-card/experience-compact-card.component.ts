import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapCheckCircleFill, bootstrapClock } from '@ng-icons/bootstrap-icons';
import { GuestExperience } from '@/domain/entities/guest-experience.model';

@Component({
  selector: 'app-experience-compact-card',
  standalone: true,
  imports: [NgIcon],
  providers: [provideIcons({ bootstrapCheckCircleFill, bootstrapClock })],
  templateUrl: './experience-compact-card.component.html',
  styleUrl: './experience-compact-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienceCompactCardComponent {
  readonly experience = input.required<GuestExperience>();
  readonly isAdded = input<boolean>(false);
  readonly cardClicked = output<void>();

  formatPrice(price: number): string {
    return price.toLocaleString('es-CO');
  }
}
