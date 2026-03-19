import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { InputComponent } from '@/presentation/shared/components/input/input.component';
import { SelectComponent, SelectOption } from '@/presentation/shared/components/select/select.component';
import { FooterComponent } from '@/presentation/shared/components/footer/footer.component';
import { BookingRoomCard, RoomCardComponent } from './components/room-card/room-card.component';
import { GetPublicUnitsUseCase } from '@/domain/use-cases/property/get-public-units.use-case';
import { Unit } from '@/domain/entities/staff.model';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapCalendar,
  bootstrapChevronLeft,
  bootstrapPeopleFill,
  bootstrapSearch,
} from '@ng-icons/bootstrap-icons';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [ButtonComponent, InputComponent, SelectComponent, FooterComponent, RoomCardComponent, NgIcon],
  providers: [
    provideIcons({
      bootstrapChevronLeft,
      bootstrapCalendar,
      bootstrapPeopleFill,
      bootstrapSearch,
    }),
  ],
  templateUrl: './booking.html',
  styleUrl: './booking.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly getPublicUnitsUseCase = inject(GetPublicUnitsUseCase);

  readonly isRoomsLoading = signal(false);

  readonly guestOptions: SelectOption[] = [
    { value: 1, label: '1 Huésped' },
    { value: 2, label: '2 Huéspedes' },
    { value: 3, label: '3 Huéspedes' },
    { value: 4, label: '4 Huéspedes' },
    { value: 5, label: '5+ Huéspedes' },
  ];

  readonly rooms = signal<BookingRoomCard[]>([]);

  ngOnInit(): void {
    this.loadPublicUnits();
  }

  private loadPublicUnits(): void {
    const tenantId = this.getTenantIdFromLocalStorage();

    if (!tenantId) {
      this.rooms.set([]);
      return;
    }

    this.isRoomsLoading.set(true);
    this.getPublicUnitsUseCase.execute(tenantId).subscribe({
      next: (units) => {
        this.rooms.set(units.map((unit) => this.toRoomCard(unit)));
        this.isRoomsLoading.set(false);
      },
      error: () => {
        this.rooms.set([]);
        this.isRoomsLoading.set(false);
      },
    });
  }

  private toRoomCard(unit: Unit): BookingRoomCard {
    return {
      id: unit.id,
      title: unit.name,
      price: unit.pricePerNight ?? 0,
      description: unit.description ?? 'Sin descripción disponible para esta habitación.',
      features: [
        { icon: 'bootstrapHouseDoorFill', label: this.getBedsSummary(unit) },
        {
          icon: 'bootstrapDoorOpenFill',
          label: `${unit.bathroomsCount ?? 0} baño${(unit.bathroomsCount ?? 0) === 1 ? '' : 's'}`,
        },
        {
          icon: 'bootstrapPeopleFill',
          label: `${unit.maxGuests ?? unit.standardGuests ?? 1} Persona${(unit.maxGuests ?? unit.standardGuests ?? 1) === 1 ? '' : 's'}`,
        },
      ],
      amenities: unit.amenities ?? [],
      badgeLabel: unit.isShared ? 'Compartida' : 'Disponible',
      badgeVariant: unit.isShared ? 'popular' : 'default',
      featured: (unit.pricePerNight ?? 0) >= 200,
    };
  }

  private getBedsSummary(unit: Unit): string {
    const beds = unit.bedrooms?.flatMap((bedroom) => bedroom.beds ?? []) ?? [];

    if (beds.length === 0) {
      return 'Sin información de camas';
    }

    const totalBeds = beds.reduce((sum, bed) => sum + (bed.count ?? 0), 0);
    return `${totalBeds} cama${totalBeds === 1 ? '' : 's'}`;
  }

  private getTenantIdFromLocalStorage(): string | null {
    const rawCurrentUser = localStorage.getItem('lymon_current_user');

    if (!rawCurrentUser) {
      return null;
    }

    try {
      const parsed = JSON.parse(rawCurrentUser) as { tenantId?: unknown };
      return typeof parsed.tenantId === 'string' && parsed.tenantId.length > 0
        ? parsed.tenantId
        : null;
    } catch {
      return null;
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  goToRoomDetails(): void {
    this.router.navigate(['/room-details']);
  }
}
