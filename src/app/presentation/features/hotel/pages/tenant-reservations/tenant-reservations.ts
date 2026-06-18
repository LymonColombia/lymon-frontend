import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { bootstrapPeople, bootstrapSearch, bootstrapCalendarEvent, bootstrapPlusCircle, bootstrapX, bootstrapCheck, bootstrapPencil } from '@ng-icons/bootstrap-icons';
import { HotelPageLayoutComponent } from '../../components/hotel-page-layout/hotel-page-layout';
import { CreateReservationWizardComponent } from './components/create-reservation-wizard/create-reservation-wizard';

export interface Reservation {
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
export class TenantReservations {
  reservations = signal<Reservation[]>([
    {
      id: 'RES-001',
      guestName: 'Juan Pérez',
      guestEmail: 'juan.perez@email.com',
      guestPhone: '+52 555 123 4567',
      propertyName: 'Hotel Sol y Mar',
      unitName: 'Suite Presidencial (Hab. 204)',
      checkIn: '2026-06-01',
      checkOut: '2026-06-05',
      status: 'Confirmada',
      totalAmount: 1250,
      createdAt: '2026-05-10T10:00:00.000Z'
    },
    {
      id: 'RES-002',
      guestName: 'Maria Garcia',
      guestEmail: 'maria.g@email.com',
      guestPhone: '+52 555 987 6543',
      propertyName: 'Vista Hermosa Cabins',
      unitName: 'Cabaña 5',
      checkIn: '2026-06-10',
      checkOut: '2026-06-12',
      status: 'Pendiente',
      totalAmount: 340.5,
      createdAt: '2026-05-12T14:30:00.000Z'
    },
    {
      id: 'RES-003',
      guestName: 'Carlos López',
      guestEmail: 'carlos.lopez@email.com',
      guestPhone: '+34 600 111 222',
      propertyName: 'Hotel Sol y Mar',
      unitName: 'Habitación Doble (Hab. 101)',
      checkIn: '2026-05-15',
      checkOut: '2026-05-20',
      status: 'Check-in',
      totalAmount: 450,
      createdAt: '2026-05-01T09:15:00.000Z'
    }
  ]);
  
  totalReservations = signal(0);
  activeCheckins = signal(0);
  isLoading = signal(false);
  errorMessage = signal('');

  selectedReservation = signal<Reservation | null>(null);
  showWizard = signal(false);

  constructor() {
    this.totalReservations.set(this.reservations().length);
    this.activeCheckins.set(this.reservations().filter(r => r.status.toLowerCase() === 'check-in').length);
  }

  openDetails(reservation: Reservation) {
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
}
