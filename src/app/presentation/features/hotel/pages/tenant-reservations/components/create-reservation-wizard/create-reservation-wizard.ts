import { Component, ChangeDetectionStrategy, signal, output, inject, OnInit } from '@angular/core';
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
import { GetPropertiesUseCase } from '@/domain/use-cases/property/get-properties.use-case';
import { GetUnitsUseCase } from '@/domain/use-cases/property/get-units.use-case';
import { GetTenantGuestsUseCase } from '@/domain/use-cases/reservation/get-tenant-guests.use-case';

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
export class CreateReservationWizardComponent implements OnInit {
  private readonly createTenantGuestUseCase = inject(CreateTenantGuestUseCase);
  private readonly getPropertiesUseCase = inject(GetPropertiesUseCase);
  private readonly getUnitsUseCase = inject(GetUnitsUseCase);
  private readonly getTenantGuestsUseCase = inject(GetTenantGuestsUseCase);

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

  properties = signal<{ id: string; name: string }[]>([]);
  units = signal<{ id: string; name: string }[]>([]);
  guests = signal<{ id: string; name: string }[]>([]);

  ngOnInit(): void {
    // Load properties
    this.getPropertiesUseCase.execute().subscribe({
      next: (props) => {
        this.properties.set(props.map(p => ({ id: p.id || '', name: p.name || 'Propiedad sin nombre' })));
      },
      error: (err) => console.error('Error fetching properties', err)
    });

    // Load tenant guests
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
    // Reset unit selection
    this.reservationForm.unitId = '';
    this.units.set([]);

    if (!propertyId) return;

    this.getUnitsUseCase.execute(propertyId).subscribe({
      next: (unitList) => {
        this.units.set(unitList.map(u => ({ id: u.id || '', name: u.name || 'Unidad sin nombre' })));
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
