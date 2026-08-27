import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { bootstrapStar, bootstrapStarFill } from '@ng-icons/bootstrap-icons';
import { GetUnitRatingsUseCase } from '@/domain/use-cases/property/get-unit-ratings.use-case';
import { UnitRating } from '@/domain/entities/staff.model';
import { SelectComponent, SelectOption } from '@/presentation/shared/components/select/select';

const RATINGS_PAGE_LIMIT = 10;

const SORT_OPTIONS: SelectOption[] = [
  { value: '', label: 'Más recientes' },
  { value: 'best', label: 'Mejor valorados' },
  { value: 'worst', label: 'Peor valorados' },
];

const FILTER_RATE_OPTIONS: SelectOption[] = [
  { value: '', label: 'Todas las estrellas' },
  { value: 5, label: '5 estrellas' },
  { value: 4, label: '4 estrellas' },
  { value: 3, label: '3 estrellas' },
  { value: 2, label: '2 estrellas' },
  { value: 1, label: '1 estrella' },
];

@Component({
  selector: 'app-room-ratings',
  standalone: true,
  imports: [NgIconComponent, SelectComponent],
  providers: [provideIcons({ bootstrapStar, bootstrapStarFill })],
  templateUrl: './room-ratings.html',
  styleUrl: './room-ratings.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoomRatingsComponent implements OnInit {
  readonly unitId = input.required<string>();

  private readonly destroyRef = inject(DestroyRef);
  private readonly getUnitRatingsUseCase = inject(GetUnitRatingsUseCase);

  readonly ratings = signal<UnitRating[]>([]);
  readonly isLoading = signal(false);
  readonly currentPage = signal(1);
  readonly total = signal(0);
  readonly sort = signal<'best' | 'worst' | undefined>(undefined);
  readonly filterRate = signal<number | undefined>(undefined);

  readonly hasMore = computed(() => this.ratings().length < this.total());

  readonly sortOptions = SORT_OPTIONS;
  readonly filterRateOptions = FILTER_RATE_OPTIONS;

  ngOnInit(): void {
    this.loadRatings(1, true);
  }

  loadRatings(page: number, reset: boolean): void {
    if (reset) {
      this.ratings.set([]);
    }

    this.isLoading.set(true);

    this.getUnitRatingsUseCase
      .execute({
        unitId: this.unitId(),
        page,
        limit: RATINGS_PAGE_LIMIT,
        sort: this.sort() ?? undefined,
        filterRate: this.filterRate() ?? undefined,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (reset) {
            this.ratings.set(response.ratings);
          } else {
            this.ratings.update((prev) => [...prev, ...response.ratings]);
          }
          this.total.set(response.total);
          this.currentPage.set(response.page);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        },
      });
  }

  onSortChange(value: string | number): void {
    const sort = value as 'best' | 'worst' | '';
    this.sort.set(sort === '' ? undefined : sort);
    this.loadRatings(1, true);
  }

  onFilterRateChange(value: string | number): void {
    this.filterRate.set(value === '' ? undefined : Number(value));
    this.loadRatings(1, true);
  }

  onLoadMore(): void {
    this.loadRatings(this.currentPage() + 1, false);
  }

  getStars(rate: number): boolean[] {
    return Array.from({ length: 5 }, (_, i) => i < rate);
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
}
