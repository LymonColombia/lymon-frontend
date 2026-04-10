import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CrmGuest } from '@/domain/entities/crm-guest.model';
import { GetCrmGuestsUseCase } from '@/domain/use-cases/crm/get-crm-guests.use-case';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import {
  SelectComponent,
  SelectOption,
} from '@/presentation/shared/components/select/select.component';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapPeopleFill,
  bootstrapPerson,
  bootstrapEnvelope,
  bootstrapTelephone,
  bootstrapChevronLeft,
  bootstrapChevronRight,
} from '@ng-icons/bootstrap-icons';

type SearchField = 'name' | 'email' | 'phone';
type FilterIcon = 'user' | 'mail' | 'phone';

interface FilterOption {
  key: SearchField;
  label: string;
  icon: FilterIcon;
}

@Component({
  selector: 'app-guests-crm',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, SelectComponent, NgIcon],
  providers: [
    provideIcons({
      bootstrapPeopleFill,
      bootstrapPerson,
      bootstrapEnvelope,
      bootstrapTelephone,
      bootstrapChevronLeft,
      bootstrapChevronRight,
    }),
  ],
  templateUrl: './guestsCrm.html',
  styleUrl: './guestsCrm.css',
})
export class GuestsCrmComponent implements OnInit {
  private readonly getCrmGuestsUseCase = inject(GetCrmGuestsUseCase);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly searchField = signal<SearchField>('name');
  readonly searchTerm = signal('');
  readonly currentPage = signal(1);
  readonly pageSize = 5;
  readonly filterOptions: FilterOption[] = [
    { key: 'name', label: 'Nombre', icon: 'user' },
    { key: 'email', label: 'Email', icon: 'mail' },
    { key: 'phone', label: 'Teléfono', icon: 'phone' },
  ];
  readonly selectOptions: SelectOption[] = this.filterOptions.map((option) => ({
    value: option.key,
    label: option.label,
  }));

  readonly guests = signal<CrmGuest[]>([]);

  ngOnInit(): void {
    this.loadGuests();
  }

  readonly filteredGuests = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const field = this.searchField();
    if (!term) {
      return this.guests();
    }

    return this.guests().filter((guest) => guest[field].toLowerCase().includes(term));
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredGuests().length / this.pageSize)),
  );

  readonly pageNumbers = computed(() =>
    Array.from({ length: this.totalPages() }, (_, index) => index + 1),
  );

  readonly selectedFilterOption = computed(
    () =>
      this.filterOptions.find((option) => option.key === this.searchField()) ??
      this.filterOptions[0],
  );

  readonly searchPlaceholder = computed(() => {
    const option = this.selectedFilterOption();
    return `Buscar por ${option.label.toLowerCase()}...`;
  });

  readonly paginatedGuests = computed(() => {
    const page = this.currentPage();
    const start = (page - 1) * this.pageSize;
    return this.filteredGuests().slice(start, start + this.pageSize);
  });

  selectSearchField(field: SearchField | string | number | null): void {
    if (field !== 'name' && field !== 'email' && field !== 'phone') {
      return;
    }

    this.searchField.set(field);
    this.currentPage.set(1);
  }

  onSearchTermChange(value: string): void {
    this.searchTerm.set(value);
    this.currentPage.set(1);
  }

  formatPhone(phone: string): string {
    if (!phone.startsWith('+') || phone.includes(' ')) {
      return phone;
    }

    const digits = phone.slice(1);
    if (digits.length <= 10) {
      return phone;
    }

    const countryCode = digits.slice(0, digits.length - 10);
    const localNumber = digits.slice(-10);
    return `+${countryCode} ${localNumber}`;
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) {
      return;
    }
    this.currentPage.set(page);
  }

  goToPreviousPage(): void {
    this.goToPage(this.currentPage() - 1);
  }

  goToNextPage(): void {
    this.goToPage(this.currentPage() + 1);
  }

  private loadGuests(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.getCrmGuestsUseCase.execute().subscribe({
      next: (guests) => {
        this.guests.set(guests);
        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading.set(false);
        if (error.status === 401) {
          this.errorMessage.set('Tu sesión expiró. Inicia sesión nuevamente.');
        } else if (error.status === 403) {
          this.errorMessage.set('No tienes permisos para ver los huéspedes.');
        } else {
          this.errorMessage.set('No se pudo cargar la lista de huéspedes. Inténtalo de nuevo.');
        }
      },
    });
  }
}
