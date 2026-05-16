import { Component, ChangeDetectionStrategy, signal, output } from '@angular/core';
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
  currentStep = signal(1);
  close = output<void>();

  guestIsRegistered = signal<boolean | null>(null);

  guestForm = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    documentId: ''
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

  onClose() {
    this.close.emit();
  }

  onSubmit() {
    console.log('Reservation created (simulated)');
    this.onClose();
  }
}
