import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapEnvelope, bootstrapPerson, bootstrapTelephone } from '@ng-icons/bootstrap-icons';
import { InputComponent } from '@/presentation/shared/components/input/input';

@Component({
  selector: 'app-checkin-guest-form',
  standalone: true,
  imports: [ReactiveFormsModule, InputComponent, NgIcon],
  providers: [provideIcons({ bootstrapEnvelope, bootstrapPerson, bootstrapTelephone })],
  templateUrl: './checkin-guest-form.html',
  styleUrl: './checkin-guest-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckinGuestFormComponent {
  readonly guestForm = input.required<FormGroup>();
  readonly guestIndex = input.required<number>();
  readonly isPrimaryGuest = input<boolean>(false);
}
