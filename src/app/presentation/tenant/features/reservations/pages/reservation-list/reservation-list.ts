import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { bootstrapPeople, bootstrapSearch, bootstrapCalendarEvent, bootstrapPlusCircle, bootstrapX, bootstrapCheck, bootstrapPencil, bootstrapInfoCircle } from '@ng-icons/bootstrap-icons';
import { forkJoin } from 'rxjs';
import { TenantPageLayoutComponent } from '@/presentation/tenant/layout/tenant-page-layout/tenant-page-layout';
import { CreateReservationWizardComponent } from './components/create-reservation-wizard/create-reservation-wizard';
import { GetReservationsUseCase } from '@/domain/shared/reservation/use-cases/get-reservations.use-case';
import { ConfirmReservationUseCase } from '@/domain/shared/reservation/use-cases/confirm-reservation.use-case';
import { CheckInReservationUseCase } from '@/domain/shared/reservation/use-cases/check-in-reservation.use-case';
import { CheckOutReservationUseCase } from '@/domain/shared/reservation/use-cases/check-out-reservation.use-case';
import { CancelReservationUseCase } from '@/domain/shared/reservation/use-cases/cancel-reservation.use-case';
import { UpdateReservationUseCase } from '@/domain/shared/reservation/use-cases/update-reservation.use-case';
import { GetPropertiesUseCase } from '@/domain/shared/property/use-cases/get-properties.use-case';
import { GetUnitsUseCase } from '@/domain/shared/property/use-cases/get-units.use-case';
import { GetTenantGuestsUseCase } from '@/domain/tenant/tenant-guest/use-cases/get-tenant-guests.use-case';
import { Reservation as DomainReservation } from '@/domain/shared/reservation/reservation.model';
import { ROOM_MESSAGES } from '@/domain/shared/property/room.constants';
import { ButtonComponent } from '@/presentation/shared/components/button/button';
import { ShiftDatePickerComponent } from '@/presentation/tenant/components/shift-date-picker/shift-date-picker';
import { SelectComponent, SelectOption } from '@/presentation/shared/components/select/select';

export interface ReservationViewModel {
  id: string;
  reservationNumber: number;
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

type StatusFilter = 'active' | 'pending' | 'confirmed' | 'checked-in' | 'finished' | 'cancelled' | 'all';

const STATUS_FILTER_OPTIONS: SelectOption[] = [
  { value: 'active', label: 'Activas (pendientes, confirmadas, check-in)' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'confirmed', label: 'Confirmadas' },
  { value: 'checked-in', label: 'En estadía (check-in)' },
  { value: 'finished', label: 'Finalizadas' },
  { value: 'cancelled', label: 'Canceladas' },
  { value: 'all', label: 'Todas' }
];

@Component({
  selector: 'app-tenant-reservations',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIconComponent, TenantPageLayoutComponent, CreateReservationWizardComponent, ButtonComponent, ShiftDatePickerComponent, SelectComponent],
  templateUrl: './reservation-list.html',
  styleUrls: ['./reservation-list.css'],
  viewProviders: [
    provideIcons({
      bootstrapPeople,
      bootstrapSearch,
      bootstrapCalendarEvent,
      bootstrapPlusCircle,
      bootstrapX,
      bootstrapCheck,
      bootstrapPencil,
      bootstrapInfoCircle
    })
  ]
})
export class TenantReservations implements OnInit {
  private readonly getReservationsUseCase = inject(GetReservationsUseCase);
  private readonly confirmReservationUseCase = inject(ConfirmReservationUseCase);
  private readonly checkInReservationUseCase = inject(CheckInReservationUseCase);
  private readonly checkOutReservationUseCase = inject(CheckOutReservationUseCase);
  private readonly cancelReservationUseCase = inject(CancelReservationUseCase);
  private readonly updateReservationUseCase = inject(UpdateReservationUseCase);
  private readonly getPropertiesUseCase = inject(GetPropertiesUseCase);
  private readonly getUnitsUseCase = inject(GetUnitsUseCase);
  private readonly getTenantGuestsUseCase = inject(GetTenantGuestsUseCase);

  reservations = signal<ReservationViewModel[]>([]);

  readonly PAGE_SIZE = 10;
  filteredCurrentPage = signal(1);
  totalReservations = signal(0);
  activeCheckins = signal(0);
  isLoading = signal(false);
  errorMessage = signal('');

  propertiesMap = signal<Record<string, string>>({});
  unitsMap = signal<Record<string, string>>({});
  guestsMap = signal<Record<string, string>>({});
  guestEmailsMap = signal<Record<string, string>>({});

  readonly statusFilterOptions: SelectOption[] = STATUS_FILTER_OPTIONS;
  statusFilter = signal<StatusFilter>('active');
  searchTerm = signal('');

  filteredReservations = computed(() => {
    const status = this.statusFilter();
    const term = this.searchTerm().trim().toLowerCase();

    return this.reservations().filter((res) => {
      const normalizedStatus = this.normalizeStatus(res.status);
      let statusMatches: boolean;

      switch (status) {
        case 'active':
          statusMatches = ['pendiente', 'confirmada', 'check-in', 'active'].includes(normalizedStatus);
          break;
        case 'pending':
          statusMatches = normalizedStatus === 'pendiente';
          break;
        case 'confirmed':
          statusMatches = normalizedStatus === 'confirmada';
          break;
        case 'checked-in':
          statusMatches = normalizedStatus === 'check-in' || normalizedStatus === 'active';
          break;
        case 'finished':
          statusMatches = normalizedStatus === 'finalizada' || normalizedStatus === 'finished' || normalizedStatus === 'checked-out';
          break;
        case 'cancelled':
          statusMatches = normalizedStatus === 'cancelada' || normalizedStatus === 'cancelled';
          break;
        case 'all':
        default:
          statusMatches = true;
          break;
      }

      if (!statusMatches) {
        return false;
      }

      if (!term) {
        return true;
      }

      const contains = (value: string) => value.toLowerCase().includes(term);
      return (
        contains(res.guestName) ||
        contains(res.guestEmail) ||
        String(res.reservationNumber).includes(term) ||
        res.id.toLowerCase().includes(term) ||
        contains(res.propertyName) ||
        contains(res.unitName)
      );
    });
  });

  readonly filteredTotalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredReservations().length / this.PAGE_SIZE))
  );

  readonly pagedReservations = computed(() => {
    const start = (this.filteredCurrentPage() - 1) * this.PAGE_SIZE;
    return this.filteredReservations().slice(start, start + this.PAGE_SIZE);
  });

  selectedReservation = signal<ReservationViewModel | null>(null);
  isProcessingStatus = signal(false);
  statusActionError = signal<string | null>(null);
  showWizard = signal(false);

  showCancelConfirm = signal(false);
  isCancelling = signal(false);
  cancelError = signal<string | null>(null);

  showEditModal = signal(false);
  isUpdating = signal(false);
  updateError = signal<string | null>(null);
  editForm = {
    checkIn: '',
    checkOut: '',
    notes: ''
  };

  showCheckInInfoModal = signal(false);

  ngOnInit(): void {
    this.loadReferenceDataAndReservations();
  }

  loadReferenceDataAndReservations(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    forkJoin({
      properties: this.getPropertiesUseCase.execute(),
      guests: this.getTenantGuestsUseCase.execute()
    }).subscribe({
      next: ({ properties, guests }) => {
        this.propertiesMap.set(
          properties.reduce<Record<string, string>>((acc, p) => {
            acc[p.id] = p.name || 'Propiedad sin nombre';
            return acc;
          }, {})
        );

        this.guestsMap.set(
          guests.reduce<Record<string, string>>((acc, g) => {
            acc[g.id] = g.fullName || g.name || g.primaryEmail || g.email || 'Sin Nombre';
            return acc;
          }, {})
        );

        this.guestEmailsMap.set(
          guests.reduce<Record<string, string>>((acc, g) => {
            acc[g.id] = g.primaryEmail || g.email || '';
            return acc;
          }, {})
        );

        const propertyIds = properties.map(p => p.id).filter(Boolean);
        if (propertyIds.length === 0) {
          this.unitsMap.set({});
          this.loadReservations();
          return;
        }

        forkJoin(propertyIds.map(id => this.getUnitsUseCase.execute(id))).subscribe({
          next: (unitsPerProperty) => {
            const allUnits = unitsPerProperty.flat();
            this.unitsMap.set(
              allUnits.reduce<Record<string, string>>((acc, u) => {
                acc[u.id] = u.name || ROOM_MESSAGES.unnamedRoom;
                return acc;
              }, {})
            );
            this.loadReservations();
          },
          error: (err) => {
            this.unitsMap.set({});
            this.loadReservations();
            console.error('Error fetching units', err);
          }
        });
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set('Error al cargar datos de referencia. Por favor intenta de nuevo.');
        console.error('Error fetching reference data:', err);
      }
    });
  }

  loadReservations(): void {
    this.errorMessage.set('');

    this.getReservationsUseCase.execute({ page: 1, limit: 10000 }).subscribe({
      next: ({ reservations: data }) => {
        const mapped = data.map((res) => this.mapToViewModel(res));
        this.reservations.set(mapped);
        this.totalReservations.set(mapped.length);
        this.filteredCurrentPage.set(1);
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

  nextPage(): void {
    if (this.filteredCurrentPage() < this.filteredTotalPages()) {
      this.filteredCurrentPage.update(p => p + 1);
    }
  }

  prevPage(): void {
    if (this.filteredCurrentPage() > 1) {
      this.filteredCurrentPage.update(p => p - 1);
    }
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
    const value = (event.target as HTMLInputElement | null)?.value ?? '';
    this.searchTerm.set(value);
    this.filteredCurrentPage.set(1);
  }

  onStatusFilterChange(value: string | number) {
    this.statusFilter.set((value as string || 'active') as StatusFilter);
    this.filteredCurrentPage.set(1);
  }

  openWizard() {
    this.showWizard.set(true);
  }

  closeWizard() {
    this.showWizard.set(false);
  }

  onReservationCreated() {
    this.closeWizard();
    this.filteredCurrentPage.set(1);
    this.loadReferenceDataAndReservations();
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
        this.loadReferenceDataAndReservations();
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
        this.loadReferenceDataAndReservations();
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
        this.loadReferenceDataAndReservations();
      },
      error: (err) => {
        this.isProcessingStatus.set(false);
        this.statusActionError.set(this.extractErrorMessage(err, 'hacer check-out'));
        console.error('Error checking out reservation:', err);
      }
    });
  }

  openCancelConfirm() {
    this.cancelError.set(null);
    this.showCancelConfirm.set(true);
  }

  closeCancelConfirm() {
    this.showCancelConfirm.set(false);
    this.cancelError.set(null);
  }

  cancelReservation() {
    const reservation = this.selectedReservation();
    if (!reservation || this.isCancelling()) return;

    this.isCancelling.set(true);
    this.cancelError.set(null);

    this.cancelReservationUseCase.execute(reservation.id).subscribe({
      next: () => {
        this.isCancelling.set(false);
        this.closeCancelConfirm();
        this.closeDetails();
        this.loadReferenceDataAndReservations();
      },
      error: (err) => {
        this.isCancelling.set(false);
        this.cancelError.set(this.extractErrorMessage(err, 'cancelar'));
        console.error('Error cancelling reservation:', err);
      }
    });
  }

  openEditModal() {
    const reservation = this.selectedReservation();
    if (!reservation) return;

    this.editForm = {
      checkIn: this.toDateInputValue(reservation.checkIn),
      checkOut: this.toDateInputValue(reservation.checkOut),
      notes: ''
    };
    this.updateError.set(null);
    this.showEditModal.set(true);
  }

  closeEditModal() {
    this.showEditModal.set(false);
    this.updateError.set(null);
  }

  updateReservation() {
    const reservation = this.selectedReservation();
    if (!reservation || this.isUpdating()) return;

    this.updateError.set(null);

    const validationError = this.validateEditForm();
    if (validationError) {
      this.updateError.set(validationError);
      return;
    }

    this.isUpdating.set(true);

    this.updateReservationUseCase.execute(reservation.id, {
      checkIn: this.editForm.checkIn,
      checkOut: this.editForm.checkOut,
      notes: this.editForm.notes || undefined
    }).subscribe({
      next: () => {
        this.isUpdating.set(false);
        this.closeEditModal();
        this.closeDetails();
        this.loadReferenceDataAndReservations();
      },
      error: (err) => {
        this.isUpdating.set(false);
        this.updateError.set(this.extractErrorMessage(err, 'actualizar'));
        console.error('Error updating reservation:', err);
      }
    });
  }

  canConfirmReservation(status: string): boolean {
    return status.toLowerCase().replaceAll('_', '-') === 'pendiente';
  }

  canCheckInReservation(status: string): boolean {
    return status.toLowerCase().replaceAll('_', '-') === 'confirmada';
  }

  isCheckInDateReached(checkIn: string): boolean {
    if (!checkIn) return false;
    const today = this.getTodayUtc();
    const checkInDate = this.parseUtcDate(checkIn);
    return checkInDate.getTime() <= today.getTime();
  }

  openCheckInInfoModal(): void {
    this.showCheckInInfoModal.set(true);
  }

  closeCheckInInfoModal(): void {
    this.showCheckInInfoModal.set(false);
  }

  onCheckInAttempt(event: Event): void {
    const reservation = this.selectedReservation();
    if (!reservation) return;
    if (!this.isCheckInDateReached(reservation.checkIn)) {
      event.preventDefault();
      event.stopPropagation();
      this.openCheckInInfoModal();
    }
  }

  onCheckInButtonClicked(res: ReservationViewModel): void {
    if (this.isProcessingStatus()) return;
    if (!this.isCheckInDateReached(res.checkIn)) {
      this.openCheckInInfoModal();
      return;
    }
    this.checkInReservation();
  }

  private getTodayUtc(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }

  private parseUtcDate(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }

  canCheckOutReservation(status: string): boolean {
    const normalized = status.toLowerCase().replaceAll('_', '-');
    return normalized === 'check-in' || normalized === 'checked-in';
  }

  canCancelReservation(status: string): boolean {
    const normalized = status.toLowerCase().replaceAll('_', '-');
    return normalized !== 'cancelada' && normalized !== 'cancelled' && normalized !== 'finalizada' && normalized !== 'finished' && normalized !== 'checked-out';
  }

  canEditReservation(status: string): boolean {
    const normalized = status.toLowerCase().replaceAll('_', '-');
    return normalized !== 'cancelada' && normalized !== 'cancelled' && normalized !== 'finalizada' && normalized !== 'finished' && normalized !== 'checked-out';
  }

  private mapToViewModel(res: DomainReservation): ReservationViewModel {
    const statusLabel = this.toStatusLabel(res.status);
    const guestName = this.guestsMap()[res.guestId] || res.guestName || res.guestId || 'Huésped desconocido';
    const propertyName = this.propertiesMap()[res.propertyId] || res.propertyId || 'Propiedad desconocida';
    const unitName = this.unitsMap()[res.unitId] || res.room || res.unitId || ROOM_MESSAGES.unknownRoom;

    return {
      id: res.id,
      reservationNumber: res.reservationNumber ?? 0,
      guestName,
      guestEmail: this.guestEmailsMap()[res.guestId] || '',
      guestPhone: '',
      propertyName,
      unitName,
      checkIn: this.formatDate(res.checkIn),
      checkOut: this.formatDate(res.checkOut),
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

    const normalized = status?.toLowerCase().replaceAll('_', '-');
    return map[normalized ?? ''] || status || 'Pendiente';
  }

  private normalizeStatus(status: string): string {
    return status
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replaceAll('_', '-');
  }

  private formatDate(value: string): string {
    if (!value) return '';
    const date = new Date(value);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private toDateInputValue(value: string): string {
    if (!value) return '';
    return value;
  }

  get today(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private validateEditForm(): string | null {
    const { checkIn, checkOut } = this.editForm;

    if (!checkIn) return 'Debes seleccionar la fecha de entrada.';
    if (!checkOut) return 'Debes seleccionar la fecha de salida.';

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (Number.isNaN(checkInDate.getTime()) || Number.isNaN(checkOutDate.getTime())) {
      return 'Las fechas seleccionadas no son válidas.';
    }

    if (checkOutDate <= checkInDate) {
      return 'La fecha de salida debe ser posterior a la fecha de entrada.';
    }

    return null;
  }

  private extractErrorMessage(err: unknown, action: string): string {
    if (typeof err === 'object' && err !== null) {
      const error = err as { message?: string; error?: { message?: string }; msg?: string };
      return error.message || error.error?.message || error.msg || `Error al ${action} la reserva. Por favor intenta de nuevo.`;
    }

    return `Error al ${action} la reserva. Por favor intenta de nuevo.`;
  }
}
