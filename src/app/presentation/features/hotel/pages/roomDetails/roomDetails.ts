import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { InputComponent } from '@/presentation/shared/components/input/input.component';
import { SelectComponent, SelectOption } from '@/presentation/shared/components/select/select.component';
import { HeaderComponent } from '@/presentation/shared/components/header/header.component';
import { FooterComponent } from '@/presentation/shared/components/footer/footer.component';
import { BreadcrumbComponent, BreadcrumbItem } from '@/presentation/shared/components/breadcrumb/breadcrumb.component';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapBoundingBox,
  bootstrapBriefcase,
  bootstrapCalendar,
  bootstrapCheckLg,
  bootstrapChevronLeft,
  bootstrapChevronRight,
  bootstrapClock,
  bootstrapCupHot,
  bootstrapDoorOpen,
  bootstrapDroplet,
  bootstrapHouseDoor,
  bootstrapInfoCircle,
  bootstrapLock,
  bootstrapPeople,
  bootstrapPeopleFill,
  bootstrapSafe,
  bootstrapScissors,
  bootstrapSearch,
  bootstrapSnow,
  bootstrapStarFill,
  bootstrapTv,
  bootstrapWifi,
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
    NgIconComponent,
  ],
  providers: [
    provideIcons({
      bootstrapBoundingBox,
      bootstrapBriefcase,
      bootstrapCalendar,
      bootstrapCheckLg,
      bootstrapChevronLeft,
      bootstrapChevronRight,
      bootstrapClock,
      bootstrapCupHot,
      bootstrapDoorOpen,
      bootstrapDroplet,
      bootstrapHouseDoor,
      bootstrapInfoCircle,
      bootstrapLock,
      bootstrapPeople,
      bootstrapPeopleFill,
      bootstrapSafe,
      bootstrapScissors,
      bootstrapSearch,
      bootstrapSnow,
      bootstrapStarFill,
      bootstrapTv,
      bootstrapWifi,
    }),
  ],
  templateUrl: './roomDetails.html',
  styleUrl: './roomDetails.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoomDetailsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly searchForm: FormGroup;

  // Select options for guests
  readonly guestOptions: SelectOption[] = [
    { value: 1, label: '1 Huésped' },
    { value: 2, label: '2 Huéspedes' },
    { value: 3, label: '3 Huéspedes' },
    { value: 4, label: '4 Huéspedes' },
  ];

  readonly breadcrumbItems: readonly BreadcrumbItem[] = [
    { label: 'Habitaciones', route: '/booking' },
    { label: 'Suite Ejecutiva' },
  ];

  constructor() {
    this.searchForm = this.fb.group({
      checkIn: [''],
      checkOut: [''],
      guests: [2]
    });
  }

  onSearch(): void {
    const formValue = this.searchForm.value;
    this.router.navigate(['/hotel/booking'], {
      queryParams: {
        checkIn: formValue.checkIn,
        checkOut: formValue.checkOut,
        guests: formValue.guests
      }
    });
  }

  onGoBack(): void {
    this.router.navigate(['/hotel/booking']);
  }
}
