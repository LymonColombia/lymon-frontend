import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { GetPublicUnitUseCase } from '@/domain/use-cases/property/get-public-unit.use-case';
import { Unit } from '@/domain/entities/staff.model';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { InputComponent } from '@/presentation/shared/components/input/input.component';
import { SelectComponent, SelectOption } from '@/presentation/shared/components/select/select.component';
import { HeaderComponent } from '@/presentation/shared/components/header/header.component';
import { FooterComponent } from '@/presentation/shared/components/footer/footer.component';
import { BreadcrumbComponent, BreadcrumbItem } from '@/presentation/shared/components/breadcrumb/breadcrumb.component';
import { RoomHeroComponent } from './components/room-hero/room-hero.component';
import { RoomGeneralInfoComponent } from './components/room-general-info/room-general-info.component';
import { RoomAmenitiesComponent } from './components/room-amenities/room-amenities.component';
import { RoomPoliciesComponent } from './components/room-policies/room-policies.component';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapCalendar,
  bootstrapChevronLeft,
  bootstrapChevronRight,
  bootstrapInfoCircle,
  bootstrapPeopleFill,
  bootstrapSearch,
} from '@ng-icons/bootstrap-icons';

@Component({
  selector: 'app-room-details',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterModule,
    ButtonComponent,
    InputComponent,
    SelectComponent,
    HeaderComponent,
    FooterComponent,
    BreadcrumbComponent,
    RoomHeroComponent,
    RoomGeneralInfoComponent,
    RoomAmenitiesComponent,
    RoomPoliciesComponent,
    NgIconComponent,
  ],
  providers: [
    provideIcons({
      bootstrapCalendar,
      bootstrapChevronLeft,
      bootstrapChevronRight,
      bootstrapInfoCircle,
      bootstrapPeopleFill,
      bootstrapSearch,
    }),
  ],
  templateUrl: './roomDetails.html',
  styleUrl: './roomDetails.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoomDetailsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly getPublicUnitUseCase = inject(GetPublicUnitUseCase);

  readonly searchForm: FormGroup = this.fb.group({
    checkIn: [''],
    checkOut: [''],
    guests: [2],
  });
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly unit = signal<Unit | null>(null);

  // Select options for guests
  readonly guestOptions: SelectOption[] = [
    { value: 1, label: '1 Huésped' },
    { value: 2, label: '2 Huéspedes' },
    { value: 3, label: '3 Huéspedes' },
    { value: 4, label: '4 Huéspedes' },
  ];

  readonly breadcrumbItems = computed<readonly BreadcrumbItem[]>(() => [
    { label: 'Habitaciones', route: '/booking' },
    { label: this.unit()?.name ?? 'Detalle de Habitación' },
  ]);

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((params) => params.get('unitId')),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((unitId) => {
        if (!unitId) {
          this.isLoading.set(false);
          this.errorMessage.set('No se recibió el identificador de la unidad.');
          this.unit.set(null);
          return;
        }

        this.loadUnitDetails(unitId);
      });
  }

  private loadUnitDetails(unitId: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.getPublicUnitUseCase
      .execute(unitId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (unit) => {
          this.unit.set(unit);
          this.isLoading.set(false);
        },
        error: () => {
          this.unit.set(null);
          this.errorMessage.set('No se pudo cargar la información de la habitación.');
          this.isLoading.set(false);
        },
      });
  }

  onSearch(): void {
    const formValue = this.searchForm.value;
    this.router.navigate(['/booking'], {
      queryParams: {
        checkIn: formValue.checkIn,
        checkOut: formValue.checkOut,
        guests: formValue.guests,
      },
    });
  }

  onGoBack(): void {
    this.router.navigate(['/booking']);
  }
}
