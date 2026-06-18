import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { bootstrapPeople, bootstrapSearch, bootstrapCalendarEvent, bootstrapPlusCircle, bootstrapX, bootstrapCheck, bootstrapPencil } from '@ng-icons/bootstrap-icons';
import { HotelPageLayoutComponent } from '../../components/hotel-page-layout/hotel-page-layout';
import { CreateReservationWizardComponent } from './components/create-reservation-wizard/create-reservation-wizard';
import { GetReservationsUseCase } from '@/domain/use-cases/reservation/get-reservations.use-case';
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

  reservations = signal<ReservationViewModel[]>([]);

  totalReservations = signal(0);
  activeCheckins = signal(0);
  isLoading = signal(false);
  errorMessage = signal('');

  selectedReservation = signal<ReservationViewModel | null>(null);
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
    this.selectedReservation.set(reservation);
  }

  closeDetails() {
    this.selectedReservation.set(null);
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
      cancelled: 'Cancelada',
      finished: 'Finalizada'
    };

    return map[status?.toLowerCase() ?? ''] || status || 'Pendiente';
  }
}
