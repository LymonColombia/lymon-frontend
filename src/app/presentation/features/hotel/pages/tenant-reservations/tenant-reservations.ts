import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { bootstrapPeople, bootstrapSearch, bootstrapCalendarEvent, bootstrapPlusCircle, bootstrapX, bootstrapCheck, bootstrapPencil } from '@ng-icons/bootstrap-icons';
import { HotelPageLayoutComponent } from '../../components/hotel-page-layout/hotel-page-layout';
import { CreateReservationWizardComponent } from './components/create-reservation-wizard/create-reservation-wizard';
import { GetReservationsUseCase } from '@/domain/use-cases/reservation/get-reservations.use-case';
import { ConfirmReservationUseCase } from '@/domain/use-cases/reservation/confirm-reservation.use-case';
import { CheckInReservationUseCase } from '@/domain/use-cases/reservation/check-in-reservation.use-case';
import { CheckOutReservationUseCase } from '@/domain/use-cases/reservation/check-out-reservation.use-case';
import { Reservation as DomainReservation } from '@/domain/entities/reservation.model';

export interface ReservationViewModel {
  id: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  propertyName: string;
  unitName: string;
  checkIn: string;
  checkOut: string;
  status: string;
  totalAmount: number;
  createdAt: string;
}

@Component({
  selector: 'app-tenant-reservations',
  standalone: true,
  imports: [CommonModule, NgIconComponent, HotelPageLayoutComponent, CreateReservationWizardComponent],
  templateUrl: './tenant-reservations.html',
  styleUrls: ['./tenant-reservations.css'],
  viewProviders: [
    provideIcons({
      bootstrapPeople,
      bootstrapSearch,
      bootstrapCalendarEvent,
      bootstrapPlusCircle,
      bootstrapX,
      bootstrapCheck,
      bootstrapPencil
    })
  ]
})
export class TenantReservations implements OnInit {
  private readonly getReservationsUseCase = inject(GetReservationsUseCase);
  private readonly confirmReservationUseCase = inject(ConfirmReservationUseCase);
  private readonly checkInReservationUseCase = inject(CheckInReservationUseCase);
  private readonly checkOutReservationUseCase = inject(CheckOutReservationUseCase);

  reservations = signal<ReservationViewModel[]>([]);

  totalReservations = signal(0);
  activeCheckins = signal(0);
  isLoading = signal(false);
  errorMessage = signal('');

  selectedReservation = signal<ReservationViewModel | null>(null);
  isProcessingStatus = signal(false);
  statusActionError = signal<string | null>(null);
  showWizard = signal(false);

  ngOnInit(): void {
    this.loadReservations();
  }

  loadReservations(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.getReservationsUseCase.execute().subscribe({
      next: (data) => {
        const mapped = data.map((res) => this.mapToViewModel(res));
        this.reservations.set(mapped);
        this.totalReservations.set(mapped.length);
        this.activeCheckins.set(mapped.filter(r => r.status.toLowerCase() === 'check-in').length);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set('Error al cargar las reservas. Por favor intenta de nuevo.');
        console.error('Error fetching reservations:', err);
      }
    });
  }

  openDetails(reservation: ReservationViewModel) {
    this.statusActionError.set(null);
    this.selectedReservation.set(reservation);
  }

  closeDetails() {
    this.selectedReservation.set(null);
    this.statusActionError.set(null);
  }

  onSearchChange(event: Event) {

  }

  openWizard() {
    this.showWizard.set(true);
  }

  closeWizard() {
    this.showWizard.set(false);
  }

  onReservationCreated() {
    this.closeWizard();
    this.loadReservations();
  }

  confirmReservation() {
    const reservation = this.selectedReservation();
    if (!reservation || this.isProcessingStatus()) return;

    this.isProcessingStatus.set(true);
    this.statusActionError.set(null);

    this.confirmReservationUseCase.execute(reservation.id).subscribe({
      next: () => {
        this.isProcessingStatus.set(false);
        this.closeDetails();
        this.loadReservations();
      },
      error: (err) => {
        this.isProcessingStatus.set(false);
        this.statusActionError.set(this.extractErrorMessage(err, 'confirmar'));
        console.error('Error confirming reservation:', err);
      }
    });
  }

  checkInReservation() {
    const reservation = this.selectedReservation();
    if (!reservation || this.isProcessingStatus()) return;

    this.isProcessingStatus.set(true);
    this.statusActionError.set(null);

    this.checkInReservationUseCase.execute(reservation.id).subscribe({
      next: () => {
        this.isProcessingStatus.set(false);
        this.closeDetails();
        this.loadReservations();
      },
      error: (err) => {
        this.isProcessingStatus.set(false);
        this.statusActionError.set(this.extractErrorMessage(err, 'hacer check-in'));
        console.error('Error checking in reservation:', err);
      }
    });
  }

  checkOutReservation() {
    const reservation = this.selectedReservation();
    if (!reservation || this.isProcessingStatus()) return;

    this.isProcessingStatus.set(true);
    this.statusActionError.set(null);

    this.checkOutReservationUseCase.execute(reservation.id).subscribe({
      next: () => {
        this.isProcessingStatus.set(false);
        this.closeDetails();
        this.loadReservations();
      },
      error: (err) => {
        this.isProcessingStatus.set(false);
        this.statusActionError.set(this.extractErrorMessage(err, 'hacer check-out'));
        console.error('Error checking out reservation:', err);
      }
    });
  }

  canConfirmReservation(status: string): boolean {
    return status.toLowerCase().replace(/_/g, '-') === 'pendiente';
  }

  canCheckInReservation(status: string): boolean {
    return status.toLowerCase().replace(/_/g, '-') === 'confirmada';
  }

  canCheckOutReservation(status: string): boolean {
    const normalized = status.toLowerCase().replace(/_/g, '-');
    return normalized === 'check-in' || normalized === 'checked-in';
  }

  private mapToViewModel(res: DomainReservation): ReservationViewModel {
    const statusLabel = this.toStatusLabel(res.status);

    return {
      id: res.id,
      guestName: res.guestName || res.guestId || 'Huésped desconocido',
      guestEmail: '',
      guestPhone: '',
      propertyName: res.propertyId || 'Propiedad desconocida',
      unitName: res.room || res.unitId || 'Unidad desconocida',
      checkIn: res.checkIn,
      checkOut: res.checkOut,
      status: statusLabel,
      totalAmount: res.totalPrice ?? 0,
      createdAt: res.createdAt
    };
  }

  private toStatusLabel(status: string | undefined): string {
    const map: Record<string, string> = {
      confirmed: 'Confirmada',
      pending: 'Pendiente',
      active: 'Check-in',
      'checked-in': 'Check-in',
      'checked-out': 'Finalizada',
      cancelled: 'Cancelada',
      finished: 'Finalizada'
    };

    const normalized = status?.toLowerCase().replace(/_/g, '-');
    return map[normalized ?? ''] || status || 'Pendiente';
  }

  private extractErrorMessage(err: unknown, action: string): string {
    if (typeof err === 'object' && err !== null) {
      const error = err as { message?: string; error?: { message?: string }; msg?: string };
      return error.message || error.error?.message || error.msg || `Error al ${action} la reserva. Por favor intenta de nuevo.`;
    }

    return `Error al ${action} la reserva. Por favor intenta de nuevo.`;
  }
}
