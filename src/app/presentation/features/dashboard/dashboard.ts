import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  OnInit,
  computed,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GetReservationsUseCase } from '@/domain/use-cases/reservation/get-reservations.use-case';
import { Reservation } from '@/domain/entities/reservation.model';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapBuilding,
  bootstrapPeople,
  bootstrapCurrencyDollar,
  bootstrapGraphUpArrow,
} from '@ng-icons/bootstrap-icons';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgIcon],
  providers: [
    provideIcons({
      bootstrapBuilding,
      bootstrapPeople,
      bootstrapCurrencyDollar,
      bootstrapGraphUpArrow,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./dashboard.css'],
  templateUrl: './dashboard.html'
})
export class DashboardComponent implements OnInit {
    private normalizeReservationStatus(status: Reservation['status'] | string): string {
      return String(status ?? '').trim().toLowerCase();
    }

    private isActiveReservation(status: Reservation['status'] | string): boolean {
      return this.normalizeReservationStatus(status) === 'active';
    }

    private isInCurrentMonth(dateValue: string): boolean {
      const reservationDate = new Date(dateValue);
      if (Number.isNaN(reservationDate.getTime())) {
        return false;
      }

      const now = new Date();
      return reservationDate.getMonth() === now.getMonth() && reservationDate.getFullYear() === now.getFullYear();
    }

    private normalizeAmount(value: unknown): number {
      const parsedValue = Number(value);
      return Number.isFinite(parsedValue) ? parsedValue : 0;
    }

    getStatusLabel(status: Reservation['status'] | string): string {
      const normalizedStatus = this.normalizeReservationStatus(status);

      switch (normalizedStatus) {
        case 'active':
          return 'Activo';
        case 'pending':
          return 'Pendiente';
        case 'finished':
          return 'Finalizada';
        case 'confirmed':
          return 'Confirmada';
        case 'cancelled':
          return 'Cancelada';
        default:
          return String(status ?? 'Sin estado');
      }
    }

    getStatusClass(status: Reservation['status'] | string): string {
      return this.normalizeReservationStatus(status);
    }

    private normalizeReservations(payload: unknown): Reservation[] {
      if (Array.isArray(payload)) {
        return payload as Reservation[];
      }

      if (payload && typeof payload === 'object' && 'data' in payload) {
        const data = (payload as { data?: unknown }).data;
        if (Array.isArray(data)) {
          return data as Reservation[];
        }
      }

      return [];
    }

  private readonly getReservationsUseCase = inject(GetReservationsUseCase);
  private readonly destroyRef = inject(DestroyRef);
  
  readonly reservations = signal<Reservation[]>([]);
  readonly isLoading = signal(false);
  readonly loadError = signal<string | null>(null);
  
  readonly occupiedRooms = computed(() => this.reservations().filter(r => this.isActiveReservation(r.status)).length);
  
  readonly activeGuests = computed(() => 
    this.reservations()
      .filter(r => this.isActiveReservation(r.status))
      .reduce((total, r) => total + (r.guestsCount || 0), 0)
  );

  readonly monthlyRevenue = computed(() => {
    return this.reservations()
      .filter(r => this.isInCurrentMonth(r.checkIn))
      .reduce((total, r) => total + this.normalizeAmount(r.totalPrice), 0);
  });

  readonly occupancyRate = computed(() => {
    const totalCapacity = 120;
    const occupied = this.occupiedRooms();
    return totalCapacity > 0 ? Math.round((occupied / totalCapacity) * 100) : 0;
  });

  readonly recentReservations = computed(() => 
    [...this.reservations()]
      .sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime())
      .slice(0, 5)
  );

  readonly reservationStats = computed(() => {
    const reservations = this.reservations();
    const stats: Array<{ monthLabel: string; count: number; revenue: number }> = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const month = d.getMonth();
      const year = d.getFullYear();
      const monthLabel = d.toLocaleString('es-ES', { month: 'short' });
      
      const finishedInMonth = reservations.filter(r => {
        const rDate = new Date(r.checkOut);
        return r.status === 'finished' && 
               rDate.getMonth() === month && 
               rDate.getFullYear() === year;
      });

      const count = finishedInMonth.length;
      const revenue = finishedInMonth.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);
      
      stats.push({ monthLabel, count, revenue });
    }

    const maxCount = Math.max(...stats.map(s => s.count), 1); 
    const maxRevenue = Math.max(...stats.map(s => s.revenue), 1);

    return stats.map(s => ({
      ...s,
      countHeight: (s.count / maxCount) * 100, 
      revenueHeight: (s.revenue / maxRevenue) * 100,
    }));
  });

  readonly revenueAxisLabels = computed(() => {
    const stats = this.reservationStats();
    const maxRevenue = Math.max(...stats.map(s => s.revenue), 100);
    return [
      Math.round(maxRevenue * 0.5),
      Math.round(maxRevenue * 0.75),
      Math.round(maxRevenue)
    ];
  });

  readonly revenueSummary = computed(() => {
    const stats = this.reservationStats();
    const current = stats.at(-1);
    const previous = stats.at(-2);

    if (!current || !previous) {
      return {
        delta: 0,
        trend: 'stable' as 'up' | 'down' | 'stable',
      };
    }

    const delta = current.revenue - previous.revenue;
    const trend: 'up' | 'down' | 'stable' = delta > 0 ? 'up' : delta < 0 ? 'down' : 'stable';

    return { delta, trend };
  });

  ngOnInit(): void {
    this.loadReservations();
  }

  loadReservations(): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    this.getReservationsUseCase.execute().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.reservations.set(this.normalizeReservations(data));
        this.isLoading.set(false);
      },
      error: (err) => {
        this.loadError.set('No se pudo cargar la información del dashboard.');
        this.isLoading.set(false);
        console.error('Error loading reservations', err);
      }
    });
  }
}


