import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { concatMap, forkJoin, Observable, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import Chart from 'chart.js/auto';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapCash,
  bootstrapCurrencyDollar,
  bootstrapGraphUpArrow,
} from '@ng-icons/bootstrap-icons';
import { GetReservationsUseCase } from '@/domain/shared/reservation/use-cases/get-reservations.use-case';
import { GetPropertiesUseCase } from '@/domain/shared/property/use-cases/get-properties.use-case';
import { GetUnitsUseCase } from '@/domain/shared/property/use-cases/get-units.use-case';
import { NotificationPollingService } from '@/infrastructure/services/notification-polling.service';
import { NotificationPanelComponent } from '@/presentation/tenant/features/dashboard/pages/dashboard/components/notification-panel/notification-panel';
import { Reservation } from '@/domain/shared/reservation/reservation.model';

const RESERVATIONS_PAGE_LIMIT = 500;
const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const OCCUPIED_STATUSES = ['active', 'check-in', 'checked-in'] as const;
const FINISHED_STATUSES = ['finished', 'checked-out', 'finalizada'] as const;
const REVENUE_STATUSES = [...OCCUPIED_STATUSES, ...FINISHED_STATUSES] as const;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgIcon, NotificationPanelComponent],
  providers: [provideIcons({ bootstrapCash, bootstrapCurrencyDollar, bootstrapGraphUpArrow })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./dashboard.css'],
  templateUrl: './dashboard.html',
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly getReservationsUseCase = inject(GetReservationsUseCase);
  private readonly getPropertiesUseCase = inject(GetPropertiesUseCase);
  private readonly getUnitsUseCase = inject(GetUnitsUseCase);
  private readonly notificationPollingService = inject(NotificationPollingService);
  private readonly destroyRef = inject(DestroyRef);

  readonly reservations = signal<Reservation[]>([]);
  readonly isLoading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly totalRooms = signal(0);

  readonly revenueCanvas = viewChild<ElementRef<HTMLCanvasElement>>('revenueCanvas');
  readonly countCanvas = viewChild<ElementRef<HTMLCanvasElement>>('countCanvas');

  private revenueChart?: Chart;
  private countChart?: Chart;

  readonly currentYear = new Date().getFullYear();
  readonly monthLabels = MONTH_LABELS;

  readonly occupiedRooms = computed(() => {
    const today = this.startOfDay(new Date());
    return this.reservations().filter(
      (r) => this.isActiveReservation(r.status) && this.isStayInProgress(r.checkIn, r.checkOut, today),
    ).length;
  });

  readonly occupancyRate = computed(() => {
    const total = this.totalRooms();
    if (total === 0) return null;
    return Math.round((this.occupiedRooms() / total) * 1000) / 10;
  });

  readonly occupancyDisplay = computed(() => {
    const rate = this.occupancyRate();
    return rate === null ? 'Sin datos' : `${rate.toFixed(1)}%`;
  });

  readonly monthlyRevenue = computed(() =>
    this.reservations()
      .filter((r) => this.isRevenueReservation(r.status) && this.isInCurrentMonth(r.checkIn))
      .reduce((total, r) => total + this.normalizeAmount(r.totalPrice), 0),
  );

  readonly totalEarnings = computed(() =>
    this.reservations()
      .filter((r) => this.isRevenueReservation(r.status) && this.parseDateOnly(r.checkIn) !== null)
      .reduce((total, r) => total + this.normalizeAmount(r.totalPrice), 0),
  );

  readonly finishedReservationsCurrentYear = computed(() =>
    this.reservations().filter(
      (r) => this.isFinishedReservation(r.status) && this.isInYear(r.checkOut, this.currentYear),
    ),
  );

  readonly revenueReservationsCurrentYear = computed(() =>
    this.reservations().filter(
      (r) => this.isRevenueReservation(r.status) && this.isInYear(r.checkOut, this.currentYear),
    ),
  );

  readonly monthlyStats = computed(() => {
    const stats = this.monthLabels.map((label) => ({ label, revenue: 0, count: 0 }));
    for (const reservation of this.revenueReservationsCurrentYear()) {
      const checkOut = this.parseDateOnly(reservation.checkOut);
      if (!checkOut) continue;
      stats[checkOut.getMonth()].revenue += this.normalizeAmount(reservation.totalPrice);
    }
    for (const reservation of this.finishedReservationsCurrentYear()) {
      const checkOut = this.parseDateOnly(reservation.checkOut);
      if (!checkOut) continue;
      stats[checkOut.getMonth()].count += 1;
    }
    return stats;
  });

  constructor() {
    effect(() => {
      this.renderCharts(this.monthlyStats());
    });
  }

  ngOnInit(): void {
    this.notificationPollingService.startPolling();
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.notificationPollingService.stopPolling();
    this.revenueChart?.destroy();
    this.countChart?.destroy();
  }

  loadDashboardData(): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    this.loadAllReservations()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (reservations) => {
          this.reservations.set(reservations);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.loadError.set('No se pudo cargar la información del dashboard.');
          this.isLoading.set(false);
          console.error('Error loading reservations', err);
        },
      });

    this.loadRoomCapacity();
  }

  retry(): void {
    this.loadDashboardData();
  }

  private loadAllReservations(page = 1, acc: Reservation[] = []): Observable<Reservation[]> {
    return this.getReservationsUseCase.execute({ page, limit: RESERVATIONS_PAGE_LIMIT }).pipe(
      concatMap(({ reservations, total }) => {
        const merged = [...acc, ...reservations];
        if (merged.length >= total || reservations.length === 0) {
          return of(merged);
        }
        return this.loadAllReservations(page + 1, merged);
      }),
    );
  }

  private loadRoomCapacity(): void {
    this.getPropertiesUseCase
      .execute()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (properties) => {
          const propertyIds = properties.map((p) => p.id).filter(Boolean);
          if (propertyIds.length === 0) return;

          forkJoin(propertyIds.map((id) => this.getUnitsUseCase.execute(id)))
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: (unitsPerProperty) => {
                const uniqueUnitIds = new Set<string>();
                for (const units of unitsPerProperty) {
                  for (const unit of units) {
                    if (unit.id) uniqueUnitIds.add(unit.id);
                  }
                }
                this.totalRooms.set(uniqueUnitIds.size);
              },
              error: (err) => console.error('Error loading units for capacity', err),
            });
        },
        error: (err) => console.error('Error loading properties for capacity', err),
      });
  }

  private renderCharts(stats: { label: string; revenue: number; count: number }[]): void {
    const revenueCanvas = this.revenueCanvas();
    const countCanvas = this.countCanvas();
    if (!revenueCanvas || !countCanvas) return;

    const revenueData = stats.map((s) => s.revenue);
    const countData = stats.map((s) => s.count);

    if (this.revenueChart) {
      this.revenueChart.data.datasets[0].data = revenueData;
      this.revenueChart.update();
    } else {
      this.revenueChart = new Chart(revenueCanvas.nativeElement, {
        type: 'line',
        data: {
          labels: this.monthLabels,
          datasets: [
            {
              label: 'Ganancias',
              data: revenueData,
              fill: true,
              borderColor: '#2f80ed',
              backgroundColor: 'rgba(47, 128, 237, 0.12)',
              tension: 0.4,
              pointBackgroundColor: '#2f80ed',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => ` ${this.formatCurrency(Number(ctx.parsed.y))}`,
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: '#64748b', font: { size: 12 } },
              border: { display: false },
            },
            y: {
              min: 0,
              grid: { color: 'rgba(100, 116, 139, 0.08)' },
              ticks: {
                color: '#64748b',
                font: { size: 12 },
                callback: (value) => this.formatCurrency(Number(value)),
              },
              border: { display: false },
            },
          },
        },
      });
    }

    if (this.countChart) {
      this.countChart.data.datasets[0].data = countData;
      this.countChart.update();
    } else {
      this.countChart = new Chart(countCanvas.nativeElement, {
        type: 'bar',
        data: {
          labels: this.monthLabels,
          datasets: [
            {
              label: 'Reservas finalizadas',
              data: countData,
              backgroundColor: '#6cc24a',
              borderRadius: 6,
              barThickness: 24,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => ` ${ctx.parsed.y} reservas`,
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: '#64748b', font: { size: 12 } },
              border: { display: false },
            },
            y: {
              min: 0,
              grid: { color: 'rgba(100, 116, 139, 0.08)' },
              ticks: {
                stepSize: 1,
                color: '#64748b',
                font: { size: 12 },
                callback: (value) => String(Number(value)),
              },
              border: { display: false },
            },
          },
        },
      });
    }
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(value);
  }

  private normalizeReservationStatus(status: string): string {
    return String(status ?? '').trim().toLowerCase().replaceAll('_', '-');
  }

  private isActiveReservation(status: string): boolean {
    return OCCUPIED_STATUSES.includes(
      this.normalizeReservationStatus(status) as (typeof OCCUPIED_STATUSES)[number],
    );
  }

  private isFinishedReservation(status: string): boolean {
    return FINISHED_STATUSES.includes(
      this.normalizeReservationStatus(status) as (typeof FINISHED_STATUSES)[number],
    );
  }

  private isRevenueReservation(status: string): boolean {
    return REVENUE_STATUSES.includes(
      this.normalizeReservationStatus(status) as (typeof REVENUE_STATUSES)[number],
    );
  }

  private isStayInProgress(checkInValue: string, checkOutValue: string, today: Date): boolean {
    const checkIn = this.parseDateOnly(checkInValue);
    const checkOut = this.parseDateOnly(checkOutValue);
    if (!checkIn || !checkOut) return false;
    return checkIn <= today && today <= checkOut;
  }

  private isInCurrentMonth(dateValue: string): boolean {
    const reservationDate = this.parseDateOnly(dateValue);
    if (!reservationDate) return false;

    const now = new Date();
    return (
      reservationDate.getMonth() === now.getMonth() &&
      reservationDate.getFullYear() === now.getFullYear()
    );
  }

  private isInYear(dateValue: string, year: number): boolean {
    const reservationDate = this.parseDateOnly(dateValue);
    if (!reservationDate) return false;
    return reservationDate.getFullYear() === year;
  }

  private startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private parseDateOnly(value: string): Date | null {
    if (!value) return null;
    const [datePart] = value.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
  }

  private normalizeAmount(value: unknown): number {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : 0;
  }
}
