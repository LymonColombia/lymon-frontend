import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Unit } from '@/domain/entities/staff.model';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { bootstrapCheckLg } from '@ng-icons/bootstrap-icons';

@Component({
  selector: 'app-room-policies',
  standalone: true,
  imports: [NgIconComponent],
  providers: [provideIcons({ bootstrapCheckLg })],
  templateUrl: './room-policies.html',
  styleUrl: './room-policies.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoomPoliciesComponent {
  readonly unit = input.required<Unit>();

  readonly policies = computed(() => {
    const maxGuests = this.unit().maxGuests ?? 0;
    const bathroomsCount = this.unit().bathroomsCount ?? 0;

    return [
      this.unit().isShared ? 'Esta habitación es compartida.' : 'Esta habitación es privada.',
      `Capacidad máxima: ${maxGuests} huésped${maxGuests === 1 ? '' : 'es'}.`,
      `Baños disponibles: ${bathroomsCount} baño${bathroomsCount === 1 ? '' : 's'}.`,
      'Consulta condiciones de cancelación al confirmar la reserva.',
    ];
  });
}
