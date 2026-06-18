import { Component, ChangeDetectionStrategy, signal, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapCheck,
  bootstrapPersonPlus,
  bootstrapPersonCheck,
  bootstrapCalendarPlus,
  bootstrapX,
  bootstrapArrowLeft,
  bootstrapArrowRight,
  bootstrapInfoCircle
} from '@ng-icons/bootstrap-icons';
import { CreateTenantGuestUseCase } from '@/domain/use-cases/reservation/create-tenant-guest.use-case';

@Component({
  selector: 'app-create-reservation-wizard',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIconComponent],
  templateUrl: './create-reservation-wizard.html',
  styleUrls: ['./create-reservation-wizard.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [
    provideIcons({
      bootstrapCheck,
      bootstrapPersonPlus,
      bootstrapPersonCheck,
      bootstrapCalendarPlus,
      bootstrapX,
      bootstrapArrowLeft,
      bootstrapArrowRight,
      bootstrapInfoCircle
    })
  ]
})
export class CreateReservationWizardComponent {
  private readonly createTenantGuestUseCase = inject(CreateTenantGuestUseCase);

  currentStep = signal(1);
  closeWizard = output<void>();

  guestIsRegistered = signal<boolean | null>(null);

  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  guestForm = {
    fullName: '',
    primaryEmail: ''
  };

  reservationForm = {
    guestId: '',
    propertyId: '',
    unitId: '',
    guestCount: 1,
    checkIn: '',
    checkOut: '',
    medium: 'MANUAL'
  };

  properties = signal([
    { id: '1', name: 'Hotel Sol y Mar' },
    { id: '2', name: 'Vista Hermosa Cabins' }
  ]);

  units = signal([
    { id: '101', name: 'Suite Presidencial (Hab. 204)' },
    { id: '102', name: 'Habitación Doble (Hab. 101)' },
    { id: '201', name: 'Cabaña 5' }
  ]);

  guests = signal([
    { id: 'g1', name: 'Juan Pérez' },
    { id: 'g2', name: 'Maria Garcia' }
  ]);

  nextStep() {
    if (this.currentStep() === 1 && this.guestIsRegistered() === true) {
      this.currentStep.set(3);
    } else {
      this.currentStep.update(s => Math.min(s + 1, 3));
    }
  }

  prevStep() {
    if (this.currentStep() === 3 && this.guestIsRegistered() === true) {
      this.currentStep.set(1);
    } else {
      this.currentStep.update(s => Math.max(s - 1, 1));
    }
  }

  setGuestRegistered(status: boolean) {
    this.guestIsRegistered.set(status);
    this.nextStep();
  }

  registerAndNext() {
    if (!this.guestForm.fullName || !this.guestForm.primaryEmail) {
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.createTenantGuestUseCase.execute(this.guestForm).subscribe({
      next: (res) => {
        this.guests.update(list => [...list, { id: res.guestId, name: res.fullName }]);
        this.reservationForm.guestId = res.guestId;

        this.isSubmitting.set(false);
        this.nextStep();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set('Error al registrar el huésped. Por favor intenta de nuevo.');
        console.error('Error creating guest:', err);
      }
    });
  }

  onClose() {
    this.closeWizard.emit();
  }

  onSubmit() {
    console.log('Reservation created (simulated)', this.reservationForm);
    this.onClose();
  }
}
