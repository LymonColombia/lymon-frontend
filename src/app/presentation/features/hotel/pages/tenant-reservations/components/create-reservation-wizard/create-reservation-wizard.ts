import { Component, ChangeDetectionStrategy, signal, output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { ShiftDatePickerComponent } from '../../../../../../shared/components/shift-date-picker/shift-date-picker.component';
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
import { CreateReservationUseCase } from '@/domain/use-cases/reservation/create-reservation.use-case';
import { GetPropertiesUseCase } from '@/domain/use-cases/property/get-properties.use-case';
import { GetUnitsUseCase } from '@/domain/use-cases/property/get-units.use-case';
import { GetTenantGuestsUseCase } from '@/domain/use-cases/reservation/get-tenant-guests.use-case';
import { ROOM_MESSAGES } from '@/domain/constants/room.constants';

@Component({
  selector: 'app-create-reservation-wizard',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIconComponent, ShiftDatePickerComponent],
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
export class CreateReservationWizardComponent implements OnInit {
  private readonly createTenantGuestUseCase = inject(CreateTenantGuestUseCase);
  private readonly createReservationUseCase = inject(CreateReservationUseCase);
  private readonly getPropertiesUseCase = inject(GetPropertiesUseCase);
  private readonly getUnitsUseCase = inject(GetUnitsUseCase);
  private readonly getTenantGuestsUseCase = inject(GetTenantGuestsUseCase);

  currentStep = signal(1);
  closeWizard = output<void>();
  reservationCreated = output<void>();

  guestIsRegistered = signal<boolean | null>(null);

  isSubmitting = signal(false);
  isCreatingGuest = signal(false);
  errorMessage = signal<string | null>(null);

  guestForm = {
    fullName: '',
    primaryEmail: ''
  };

  reservationForm = {
    guestId: '',
    propertyId: '',
    unitId: '',
    guestsCount: 1,
    checkIn: '',
    checkOut: '',
    source: 'MANUAL',
    notes: ''
  };

  properties = signal<{ id: string; name: string }[]>([]);
  units = signal<{ id: string; name: string }[]>([]);
  guests = signal<{ id: string; name: string }[]>([]);

  ngOnInit(): void {
    this.getPropertiesUseCase.execute().subscribe({
      next: (props) => {
        this.properties.set(props.map(p => ({ id: p.id || '', name: p.name || 'Propiedad sin nombre' })));
      },
      error: (err) => console.error('Error fetching properties', err)
    });

    this.getTenantGuestsUseCase.execute().subscribe({
      next: (guestList) => {
        this.guests.set(guestList.map(g => ({
          id: g.id,
          name: g.fullName || g.name || g.primaryEmail || g.email || 'Sin Nombre'
        })));
      },
      error: (err) => console.error('Error fetching guests', err)
    });
  }

  onPropertySelect(propertyId: string) {
    this.reservationForm.unitId = '';
    this.units.set([]);

    if (!propertyId) return;

    this.getUnitsUseCase.execute(propertyId).subscribe({
      next: (unitList) => {
        this.units.set(unitList.map(u => ({ id: u.id || '', name: u.name || ROOM_MESSAGES.unnamedRoom })));
      },
      error: (err) => console.error('Error fetching units', err)
    });
  }

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

    this.isCreatingGuest.set(true);
    this.errorMessage.set(null);

    this.createTenantGuestUseCase.execute(this.guestForm).subscribe({
      next: (res) => {
        this.guests.update(list => [...list, { id: res.guestId, name: res.fullName }]);
        this.reservationForm.guestId = res.guestId;

        this.isCreatingGuest.set(false);
        this.nextStep();
      },
      error: (err) => {
        this.isCreatingGuest.set(false);
        this.errorMessage.set('Error al registrar el huésped. Por favor intenta de nuevo.');
        console.error('Error creating guest:', err);
      }
    });
  }

  onClose() {
    this.closeWizard.emit();
  }

  onSubmit() {
    this.errorMessage.set(null);

    const validationError = this.validateReservation();
    if (validationError) {
      this.errorMessage.set(validationError);
      return;
    }

    this.isSubmitting.set(true);

    this.createReservationUseCase.execute({
      propertyId: this.reservationForm.propertyId,
      unitId: this.reservationForm.unitId,
      guestId: this.reservationForm.guestId,
      checkIn: this.reservationForm.checkIn,
      checkOut: this.reservationForm.checkOut,
      guestsCount: Number(this.reservationForm.guestsCount),
      source: this.reservationForm.source,
      notes: this.reservationForm.notes || undefined
    }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.reservationCreated.emit();
        this.onClose();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(this.extractErrorMessage(err));
        console.error('Error creating reservation:', err);
      }
    });
  }

  get today(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private validateReservation(): string | null {
    const { guestId, propertyId, unitId, checkIn, checkOut, guestsCount } = this.reservationForm;

    if (!guestId) return 'Debes seleccionar un huésped.';
    if (!propertyId) return 'Debes seleccionar una propiedad.';
    if (!unitId) return 'Debes seleccionar una habitación.';
    if (!checkIn) return 'Debes seleccionar la fecha de entrada.';
    if (!checkOut) return 'Debes seleccionar la fecha de salida.';

    if (!/^\d{4}-\d{2}-\d{2}$/.test(checkIn) || !/^\d{4}-\d{2}-\d{2}$/.test(checkOut)) {
      return 'Las fechas seleccionadas no son válidas.';
    }

    if (checkOut <= checkIn) {
      return 'La fecha de salida debe ser posterior a la fecha de entrada.';
    }

    if (!guestsCount || guestsCount < 1) {
      return 'La cantidad de huéspedes debe ser al menos 1.';
    }

    return null;
  }

  private extractErrorMessage(err: unknown): string {
    if (typeof err === 'object' && err !== null) {
      const error = err as { message?: string; error?: { message?: string }; msg?: string };
      return error.message || error.error?.message || error.msg || 'Error al crear la reserva. Por favor intenta de nuevo.';
    }

    return 'Error al crear la reserva. Por favor intenta de nuevo.';
  }

}
