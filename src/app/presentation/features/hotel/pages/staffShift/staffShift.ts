import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { HotelPageLayoutComponent } from '@/presentation/features/hotel/components/hotel-page-layout/hotel-page-layout';
import { CreateShiftUseCase } from '@/domain/use-cases/shift/create-shift.use-case';
import { GetStaffUseCase } from '@/domain/use-cases/staff/get-staff.use-case';
import { StaffRepository } from '@/domain/repositories/staff.repository';
import { StaffMember, Property } from '@/domain/entities/staff.model';

type PreviewTab = 'calendar' | 'fixed';
type ShiftStatus = 'Activo' | 'Inactivo';

interface DayAssignment {
  employeeName: string;
  employeeInitials: string;
  propertyName: string;
  shiftName: string;
  shiftTime: string;
}

interface AssignmentDay {
  dateIso: string;
  dateLabel: string;
  assignments: DayAssignment[];
}

interface FixedShiftCard {
  id: number;
  name: string;
  timeRange: string;
  status: ShiftStatus;
}

interface ShiftOption {
  id: number;
  name: string;
  timeRange: string;
}

@Component({
  selector: 'app-staff-shift',
  standalone: true,
  imports: [HotelPageLayoutComponent, FormsModule],
  templateUrl: './staffShift.html',
  styleUrl: './staffShift.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StaffShiftComponent implements OnInit {
  private readonly createShiftUseCase = inject(CreateShiftUseCase);
  private readonly getStaffUseCase = inject(GetStaffUseCase);
  private readonly staffRepository = inject(StaffRepository);

  // ── Tab navigation ──────────────────────────────────────────────────────────
  readonly activeTab = signal<PreviewTab>('calendar');

  // ── Calendar tab ────────────────────────────────────────────────────────────
  readonly calendarSearch = signal('');
  readonly calendarDateFilter = signal('');
  readonly isCreateAssignmentModalOpen = signal(false);
  readonly assignmentDate = signal('');
  readonly assignmentProperty = signal('');
  readonly assignmentEmployee = signal('');
  readonly assignmentShiftId = signal<number | null>(null);
  readonly createAssignmentError = signal('');

  readonly fixedSearch = signal('');
  readonly isCreateModalOpen = signal(false);

  readonly newShiftStaffMemberIds = signal<string[]>([]);
  readonly newShiftPropertyId = signal('');
  readonly newShiftStartDate = signal('');
  readonly newShiftEndDate = signal('');
  readonly newShiftStart = signal('');
  readonly newShiftEnd = signal('');
  readonly newShiftNotes = signal('');

  readonly newShiftName = signal('');
  readonly newShiftStatus = signal<ShiftStatus>('Activo');
  readonly createShiftError = signal('');

  readonly staffMembers = signal<StaffMember[]>([]);
  readonly properties = signal<Property[]>([]);
  readonly isCreatingShift = signal(false);

  readonly todayIso = computed(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  private nextShiftId = 4;

  readonly assignmentDays = signal<AssignmentDay[]>([
    {
      dateIso: '2026-04-11',
      dateLabel: 'sabado, 11 de abril de 2026',
      assignments: [
        {
          employeeName: 'Ana Torres',
          employeeInitials: 'AT',
          propertyName: 'Hotel Centro',
          shiftName: 'Turno Mañana',
          shiftTime: '07:00 - 15:00',
        },
        {
          employeeName: 'Carlos Vega',
          employeeInitials: 'CV',
          propertyName: 'Hotel Norte',
          shiftName: 'Turno Tarde',
          shiftTime: '15:00 - 23:00',
        },
      ],
    },
  ]);

  readonly fixedShifts = signal<FixedShiftCard[]>([
    { id: 1, name: 'Turno Mañana', timeRange: '07:00 - 15:00', status: 'Activo' },
    { id: 2, name: 'Turno Tarde', timeRange: '15:00 - 23:00', status: 'Activo' },
    { id: 3, name: 'Turno Noche', timeRange: '23:00 - 07:00', status: 'Inactivo' },
  ]);

  readonly filteredAssignmentDays = computed<AssignmentDay[]>(() => {
    const query = this.normalizeText(this.calendarSearch());
    const selectedDate = this.calendarDateFilter();

    let filteredDays = this.assignmentDays();
    if (selectedDate) {
      filteredDays = filteredDays.filter((day) => day.dateIso === selectedDate);
    }

    if (!query) {
      return filteredDays;
    }

    return filteredDays
      .map((day) => ({
        ...day,
        assignments: day.assignments.filter((assignment) => {
          const searchable = [
            assignment.employeeName,
            assignment.propertyName,
            assignment.shiftName,
            assignment.shiftTime,
          ]
            .map((value) => this.normalizeText(value))
            .join(' ');

          return searchable.includes(query);
        }),
      }))
      .filter((day) => day.assignments.length > 0);
  });

  readonly assignmentPropertyOptions = computed<string[]>(() => {
    const propertySet = new Set<string>();

    this.assignmentDays().forEach((day) => {
      day.assignments.forEach((assignment) => {
        if (assignment.propertyName.trim()) {
          propertySet.add(assignment.propertyName);
        }
      });
    });

    return Array.from(propertySet).sort((a, b) => a.localeCompare(b));
  });

  readonly assignmentEmployeeOptions = computed<string[]>(() => {
    const employeeSet = new Set<string>();

    this.assignmentDays().forEach((day) => {
      day.assignments.forEach((assignment) => {
        if (assignment.employeeName.trim()) {
          employeeSet.add(assignment.employeeName);
        }
      });
    });

    return Array.from(employeeSet).sort((a, b) => a.localeCompare(b));
  });

  readonly assignmentShiftOptions = computed<ShiftOption[]>(() =>
    this.fixedShifts().map((shift) => ({
      id: shift.id,
      name: shift.name,
      timeRange: shift.timeRange,
    })),
  );

  readonly filteredFixedShifts = computed<FixedShiftCard[]>(() => {
    const query = this.normalizeText(this.fixedSearch());
    if (!query) {
      return this.fixedShifts();
    }

    return this.fixedShifts().filter((shift) => {
      const searchable = [shift.name, shift.timeRange, shift.status]
        .map((value) => this.normalizeText(value))
        .join(' ');

      return searchable.includes(query);
    });
  });

  readonly fixedShiftCount = computed(() => this.fixedShifts().length);
  readonly activeFixedShiftCount = computed(
    () => this.fixedShifts().filter((shift) => shift.status === 'Activo').length,
  );
  readonly inactiveFixedShiftCount = computed(
    () => this.fixedShifts().filter((shift) => shift.status === 'Inactivo').length,
  );

  isStaffMemberSelected(id: string): boolean {
    return this.newShiftStaffMemberIds().includes(id);
  }

  ngOnInit(): void {
    this.loadStaff();
    this.loadProperties();
  }

  private loadStaff(): void {
    this.getStaffUseCase.execute().subscribe({
      next: (members) => this.staffMembers.set(members),
      error: () => this.staffMembers.set([]),
    });
  }

  private loadProperties(): void {
    this.staffRepository.getProperties().subscribe({
      next: (response) => {
        const data = response.data ?? [];
        this.properties.set(data);
        if (data.length > 0 && !this.newShiftPropertyId()) {
          this.newShiftPropertyId.set(data[0].id);
        }
      },
      error: () => this.properties.set([]),
    });
  }

  showCalendarTab(): void {
    this.activeTab.set('calendar');
  }

  showFixedTab(): void {
    this.activeTab.set('fixed');
  }

  onCalendarSearch(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.calendarSearch.set(target?.value ?? '');
  }

  onCalendarDateFilterInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.calendarDateFilter.set(target?.value ?? '');
  }

  onFixedSearch(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.fixedSearch.set(target?.value ?? '');
  }

  openCreateAssignmentModal(): void {
    this.isCreateAssignmentModalOpen.set(true);
    this.createAssignmentError.set('');

    const defaultDate = this.assignmentDays()[0]?.dateIso ?? '';
    const defaultProperty = this.assignmentPropertyOptions()[0] ?? '';
    const defaultEmployee = this.assignmentEmployeeOptions()[0] ?? '';
    const defaultShiftId = this.assignmentShiftOptions()[0]?.id ?? null;
    this.assignmentDate.set(defaultDate);
    this.assignmentProperty.set(defaultProperty);
    this.assignmentEmployee.set(defaultEmployee);
    this.assignmentShiftId.set(defaultShiftId);
  }

  closeCreateAssignmentModal(): void {
    this.isCreateAssignmentModalOpen.set(false);
    this.resetCreateAssignmentForm();
  }

  onAssignmentPropertyChange(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    this.assignmentProperty.set(target?.value ?? '');
  }

  onAssignmentDateInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.assignmentDate.set(target?.value ?? '');
  }

  onAssignmentEmployeeChange(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    this.assignmentEmployee.set(target?.value ?? '');
  }

  onAssignmentShiftChange(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    const parsedId = Number(target?.value ?? NaN);
    this.assignmentShiftId.set(Number.isFinite(parsedId) ? parsedId : null);
  }

  createAssignment(): void {
    const dateIso = this.assignmentDate().trim();
    const propertyName = this.assignmentProperty().trim();
    const employeeName = this.assignmentEmployee().trim();
    const shiftId = this.assignmentShiftId();

    if (!dateIso || !propertyName || !employeeName || shiftId === null) {
      this.createAssignmentError.set(
        'Completa fecha, propiedad, empleado y turno para crear la asignacion.',
      );
      return;
    }

    const selectedShift = this.fixedShifts().find((shift) => shift.id === shiftId);
    if (!selectedShift) {
      this.createAssignmentError.set('El turno seleccionado no es valido.');
      return;
    }

    const newAssignment: DayAssignment = {
      employeeName,
      employeeInitials: this.buildEmployeeInitials(employeeName),
      propertyName,
      shiftName: selectedShift.name,
      shiftTime: selectedShift.timeRange,
    };

    this.assignmentDays.update((days) => {
      const existingDay = days.find((day) => day.dateIso === dateIso);
      if (existingDay) {
        return days.map((day) => {
          if (day.dateIso !== dateIso) {
            return day;
          }

          return {
            ...day,
            assignments: [newAssignment, ...day.assignments],
          };
        });
      }

      const newDay: AssignmentDay = {
        dateIso,
        dateLabel: this.formatDateLabel(dateIso),
        assignments: [newAssignment],
      };

      return [...days, newDay].sort((a, b) => a.dateIso.localeCompare(b.dateIso));
    });

    if (!this.calendarDateFilter()) {
      this.calendarDateFilter.set(dateIso);
    }

    this.closeCreateAssignmentModal();
  }

  clearCalendarDateFilter(): void {
    this.calendarDateFilter.set('');
  }

  openCreateShiftModal(): void {
    this.isCreateModalOpen.set(true);
    this.createShiftError.set('');
    if (!this.newShiftPropertyId() && this.properties().length > 0) {
      this.newShiftPropertyId.set(this.properties()[0].id);
    }
  }

  closeCreateShiftModal(): void {
    this.isCreateModalOpen.set(false);
    this.resetCreateShiftForm();
  }

  onNewShiftNameInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.newShiftName.set(target?.value ?? '');
  }

  onNewShiftStartInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.newShiftStart.set(target?.value ?? '');
  }

  onNewShiftEndInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.newShiftEnd.set(target?.value ?? '');
  }

  onNewShiftStartDateInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.newShiftStartDate.set(target?.value ?? '');
  }

  onNewShiftEndDateInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.newShiftEndDate.set(target?.value ?? '');
  }

  onNewShiftNotesInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement | null;
    this.newShiftNotes.set(target?.value ?? '');
  }

  onNewShiftPropertyChange(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    this.newShiftPropertyId.set(target?.value ?? '');
  }

  onNewShiftStatusChange(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    if (!target) {
      return;
    }
    this.newShiftStatus.set(target.value === 'Inactivo' ? 'Inactivo' : 'Activo');
  }

  toggleStaffMemberSelection(memberId: string): void {
    this.newShiftStaffMemberIds.update((ids) => {
      if (ids.includes(memberId)) {
        return ids.filter((id) => id !== memberId);
      }
      return [...ids, memberId];
    });
  }

  createShift(): void {
    const name = this.newShiftName().trim();
    const staffMemberIds = this.newShiftStaffMemberIds();
    const propertyId = this.newShiftPropertyId().trim();
    const startDate = this.newShiftStartDate().trim();
    const endDate = this.newShiftEndDate().trim();
    const startHour = this.newShiftStart().trim();
    const endHour = this.newShiftEnd().trim();
    const notes = this.newShiftNotes().trim();

    if (!name) {
      this.createShiftError.set('Ingresa un nombre para el turno.');
      return;
    }

    if (!propertyId) {
      this.createShiftError.set('Selecciona una propiedad.');
      return;
    }
    if (!startDate || !endDate) {
      this.createShiftError.set('Completa las fechas de inicio y fin del turno.');
      return;
    }
    const today = this.todayIso();
    if (startDate < today) {
      this.createShiftError.set('La fecha de inicio no puede ser una fecha pasada.');
      return;
    }
    if (endDate < today) {
      this.createShiftError.set('La fecha de fin no puede ser una fecha pasada.');
      return;
    }
    if (startDate > endDate) {
      this.createShiftError.set('La fecha de inicio no puede ser posterior a la fecha de fin.');
      return;
    }
    if (!startHour || !endHour) {
      this.createShiftError.set('Completa el horario de inicio y salida del turno.');
      return;
    }

    if (startHour === endHour) {
      this.createShiftError.set('La hora de inicio y salida no pueden ser iguales.');
      return;
    }

    this.isCreatingShift.set(true);
    this.createShiftError.set('');

    this.createShiftUseCase
      .execute({
        name,
        ...(staffMemberIds.length > 0 ? { staffMemberIds } : {}),
        propertyId,
        startDate,
        endDate,
        startHour,
        endHour,
        ...(notes ? { notes } : {}),
      })
      .subscribe({
        next: () => {

          const propertyName =
            this.properties().find((p) => p.id === propertyId)?.name ?? propertyId;
          const newCard: FixedShiftCard = {
            id: this.nextShiftId,
            name: `Turno ${propertyName} (${startDate})`,
            timeRange: `${startHour} - ${endHour}`,
            status: this.newShiftStatus(),
          };
          this.nextShiftId += 1;
          this.fixedShifts.update((shifts) => [...shifts, newCard]);
          this.isCreatingShift.set(false);
          this.closeCreateShiftModal();
        },
        error: (err: unknown) => {
          let message = 'Ocurrio un error al crear el turno. Intenta de nuevo.';
          if (err && typeof err === 'object') {
            const httpErr = err as Record<string, unknown>;
            const body = httpErr['error'] as Record<string, unknown> | null;
            if (typeof body?.['message'] === 'string' && body['message']) {
              message = body['message'];
            } else if (Array.isArray(body?.['message']) && body['message'].length > 0) {
              message = (body['message'] as string[]).join(' ');
            } else if (typeof httpErr['message'] === 'string' && httpErr['message']) {
              message = httpErr['message'];
            }
          }
          this.createShiftError.set(message);
          this.isCreatingShift.set(false);
        },
      });
  }

  toggleShiftStatus(shiftId: number): void {
    this.fixedShifts.update((shifts) =>
      shifts.map((shift) => {
        if (shift.id !== shiftId) {
          return shift;
        }

        return {
          ...shift,
          status: shift.status === 'Activo' ? 'Inactivo' : 'Activo',
        };
      }),
    );
  }

  private resetCreateShiftForm(): void {
    this.newShiftName.set('');
    this.newShiftStaffMemberIds.set([]);
    this.newShiftPropertyId.set('');
    this.newShiftStartDate.set('');
    this.newShiftEndDate.set('');
    this.newShiftStart.set('');
    this.newShiftEnd.set('');
    this.newShiftNotes.set('');
    this.newShiftStatus.set('Activo');
    this.createShiftError.set('');
    this.isCreatingShift.set(false);
  }

  private resetCreateAssignmentForm(): void {
    this.assignmentDate.set('');
    this.assignmentProperty.set('');
    this.assignmentEmployee.set('');
    this.assignmentShiftId.set(null);
    this.createAssignmentError.set('');
  }

  private formatDateLabel(dateIso: string): string {
    const date = new Date(`${dateIso}T00:00:00`);
    return new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  }

  private buildEmployeeInitials(fullName: string): string {
    const initials = fullName
      .split(' ')
      .filter((chunk) => chunk.trim().length > 0)
      .slice(0, 2)
      .map((chunk) => chunk.charAt(0).toUpperCase())
      .join('');

    return initials || 'NA';
  }

  private normalizeText(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }
}
