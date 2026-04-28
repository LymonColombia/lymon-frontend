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
import { GetShiftsUseCase } from '@/domain/use-cases/shift/get-shifts.use-case';
import { GetStaffUseCase } from '@/domain/use-cases/staff/get-staff.use-case';
import { UpdateShiftUseCase } from '@/domain/use-cases/shift/update-shift.use-case';
import { DeleteShiftUseCase } from '@/domain/use-cases/shift/delete-shift.use-case';
import { StaffRepository } from '@/domain/repositories/staff.repository';
import { StaffMember, Property } from '@/domain/entities/staff.model';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapTrash,
  bootstrapPencil,
  bootstrapArrowRight,
  bootstrapArrowLeft,
  bootstrapClockFill,
  bootstrapPersonCheck,
  bootstrapExclamationTriangle,
  bootstrapCheckCircle,
} from '@ng-icons/bootstrap-icons';

type PreviewTab = 'calendar' | 'fixed';

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
  id: string | number;
  name: string;
  timeRange: string;
  startDate?: string;
  endDate?: string;
  propertyName?: string;
  propertyId?: string;
  notes?: string;
}

interface ShiftOption {
  id: string | number;
  name: string;
  timeRange: string;
}

@Component({
  selector: 'app-staff-shift',
  standalone: true,
  imports: [HotelPageLayoutComponent, FormsModule, NgIconComponent],
  providers: [
    provideIcons({
      bootstrapTrash,
      bootstrapPencil,
      bootstrapArrowRight,
      bootstrapArrowLeft,
      bootstrapClockFill,
      bootstrapPersonCheck,
      bootstrapExclamationTriangle,
      bootstrapCheckCircle,
    }),
  ],
  templateUrl: './staffShift.html',
  styleUrl: './staffShift.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StaffShiftComponent implements OnInit {
  private readonly createShiftUseCase = inject(CreateShiftUseCase);
  private readonly getShiftsUseCase = inject(GetShiftsUseCase);
  private readonly updateShiftUseCase = inject(UpdateShiftUseCase);
  private readonly deleteShiftUseCase = inject(DeleteShiftUseCase);
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
  readonly assignmentShiftId = signal<string | number | null>(null);
  readonly createAssignmentError = signal('');

  readonly fixedSearch = signal('');
  readonly fixedPropertyFilter = signal('');
  readonly fixedDateFilter = signal('');

  readonly selectedShiftDetail = signal<FixedShiftCard | null>(null);

  readonly notification = signal<{ message: string; type: 'error' | 'success' } | null>(null);
  private notificationTimeout: any;

  readonly currentWeekStart = signal<Date>(this.getStartOfWeek(new Date()));

  readonly isCreateModalOpen = signal(false);

  readonly newShiftStaffMemberIds = signal<string[]>([]);
  readonly newShiftPropertyId = signal('');
  readonly newShiftStartDate = signal('');
  readonly newShiftEndDate = signal('');
  readonly newShiftStart = signal('');
  readonly newShiftEnd = signal('');
  readonly newShiftNotes = signal('');

  readonly newShiftName = signal('');
  readonly createShiftError = signal('');

  readonly staffMembers = signal<StaffMember[]>([]);
  readonly properties = signal<Property[]>([]);
  readonly isCreatingShift = signal(false);
  readonly isEditingDetail = signal(false);
  readonly isConfirmEditModalOpen = signal(false);
  readonly isConfirmDeleteModalOpen = signal(false);
  readonly isUpdating = signal(false);
  readonly isDeleting = signal(false);

  editShiftNameValue = '';
  editStartDateValue = '';
  editEndDateValue = '';
  editStartHourValue = '';
  editEndHourValue = '';
  editNotesValue = '';

  readonly todayIso = computed(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  private readonly nextShiftId = 1000;

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

  readonly fixedShifts = signal<FixedShiftCard[]>([]);

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
    const propertyQuery = this.normalizeText(this.fixedPropertyFilter());
    const dateQuery = this.fixedDateFilter();

    return this.fixedShifts().filter((shift) => {
      const matchSearch = !query || [shift.name, shift.timeRange]
        .map((value) => this.normalizeText(value))
        .join(' ')
        .includes(query);

      const matchProperty = !propertyQuery || (shift.propertyName && this.normalizeText(shift.propertyName).includes(propertyQuery));

      const matchDate = !dateQuery || (shift.startDate && shift.endDate && shift.startDate <= dateQuery && shift.endDate >= dateQuery);

      return matchSearch && matchProperty && matchDate;
    });
  });

  readonly fixedPropertyOptions = computed<string[]>(() => {
    const propertySet = new Set<string>();
    this.fixedShifts().forEach(shift => {
      if (shift.propertyName) propertySet.add(shift.propertyName);
    });
    return Array.from(propertySet).sort((a, b) => a.localeCompare(b));
  });

  readonly ganttDays = computed(() => {
    const days = [];
    const start = new Date(this.currentWeekStart());
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const name = new Intl.DateTimeFormat('es-ES', { weekday: 'short' }).format(d);
      const shortName = name.charAt(0).toUpperCase() + name.slice(1, 3);
      days.push({
        date: d.getDate(),
        name: shortName,
        iso,
        isToday: iso === this.todayIso()
      });
    }
    return days;
  });

  readonly weekDateRangeLabel = computed(() => {
    const days = this.ganttDays();
    if (days.length === 0) return '';
    const start = new Date(`${days[0].iso}T00:00:00`);
    const end = new Date(`${days[6].iso}T00:00:00`);
    const formatter = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' });
    return `Del ${formatter.format(start)} al ${formatter.format(end)}`;
  });

  readonly fixedShiftCount = computed(() => this.fixedShifts().length);

  isStaffMemberSelected(id: string): boolean {
    return this.newShiftStaffMemberIds().includes(id);
  }

  private getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  nextWeek(): void {
    const next = new Date(this.currentWeekStart());
    next.setDate(next.getDate() + 7);
    this.currentWeekStart.set(next);
  }

  prevWeek(): void {
    const prev = new Date(this.currentWeekStart());
    prev.setDate(prev.getDate() - 7);
    this.currentWeekStart.set(prev);
  }

  isShiftActiveInDay(shift: FixedShiftCard, dateIso: string): boolean {
    if (!shift.startDate || !shift.endDate) return false;
    return shift.startDate <= dateIso && shift.endDate >= dateIso;
  }

  getShiftsForDay(dateIso: string) {
    const yesterdayIso = this.getYesterdayIso(dateIso);
    const segments: { shift: FixedShiftCard; gridColumn: string }[] = [];

    for (const shift of this.filteredFixedShifts()) {
      if (shift.startDate && shift.endDate) {
        this.processShiftForDay(shift, dateIso, yesterdayIso, segments);
      }
    }

    return segments;
  }

  private getYesterdayIso(dateIso: string): string {
    const currentDay = new Date(`${dateIso}T00:00:00`);
    const yesterday = new Date(currentDay);
    yesterday.setDate(yesterday.getDate() - 1);
    const y = yesterday.getFullYear();
    const m = String(yesterday.getMonth() + 1).padStart(2, '0');
    const d = String(yesterday.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private processShiftForDay(
    shift: FixedShiftCard,
    dateIso: string,
    yesterdayIso: string,
    segments: { shift: FixedShiftCard; gridColumn: string }[]
  ): void {
    const [startH, startM, endH, endM] = this.parseTimeRange(shift.timeRange);
    const startQuarter = Math.round((startH * 60 + startM) / 15);
    const endQuarter = Math.round((endH * 60 + endM) / 15);

    const isStartedToday = shift.startDate! <= dateIso && shift.endDate! >= dateIso;

    if (startQuarter < endQuarter) {
      if (isStartedToday) {
        segments.push({ shift, gridColumn: `${startQuarter + 1} / ${endQuarter + 1}` });
      }
    } else {
      this.handleOvernightShift(shift, dateIso, yesterdayIso, isStartedToday, startQuarter, endQuarter, segments);
    }
  }

  private parseTimeRange(timeRange: string): number[] {
    const [startStr, endStr] = timeRange.split('-').map(s => s.trim());
    const [startH, startM] = startStr.split(':').map(Number);
    const [endH, endM] = endStr.split(':').map(Number);
    return [startH, startM, endH, endM];
  }

  private handleOvernightShift(
    shift: FixedShiftCard,
    dateIso: string,
    yesterdayIso: string,
    isStartedToday: boolean,
    startQuarter: number,
    endQuarter: number,
    segments: { shift: FixedShiftCard; gridColumn: string }[]
  ): void {
    if (isStartedToday) {
      segments.push({ shift, gridColumn: `${startQuarter + 1} / 97` });
    }

    const isStartedYesterday = shift.startDate! <= yesterdayIso && shift.endDate! >= yesterdayIso;
    if (isStartedYesterday) {
      segments.push({ shift, gridColumn: `1 / ${endQuarter + 1}` });
    }
  }

  readonly ganttHours = computed(() => {
    return Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  });

  getShiftColorClass(shiftId: string | number): string {
    const colors = ['gantt-bar--1', 'gantt-bar--2', 'gantt-bar--3', 'gantt-bar--4', 'gantt-bar--5'];
    const idHash = typeof shiftId === 'string'
      ? Array.from(shiftId).reduce((acc, char) => acc + (char.codePointAt(0) || 0), 0)
      : shiftId;
    return colors[idHash % colors.length];
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
        this.loadFixedShifts(); // Load shifts after properties are ready
      },
      error: () => {
        this.properties.set([]);
        this.loadFixedShifts(); // Still try to load shifts
      }
    });
  }

  private loadFixedShifts(): void {
    this.getShiftsUseCase.execute().subscribe({
      next: (shifts) => {
        const mappedShifts: FixedShiftCard[] = shifts.map((s) => ({
          id: s.id ?? crypto.randomUUID(),
          name: s.name,
          timeRange: `${s.startHour} - ${s.endHour}`,
          startDate: s.startDate.split('T')[0],
          endDate: s.endDate.split('T')[0],
          propertyName: this.properties().find(p => p.id === s.propertyId)?.name ?? 'N/A',
          propertyId: s.propertyId,
          notes: s.notes
        }));
        this.fixedShifts.set(mappedShifts);
      },
      error: () => this.fixedShifts.set([])
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

  isDateLocked(dateStr: string | null | undefined): boolean {
    if (!dateStr) return false;
    return dateStr <= this.todayIso();
  }

  onFixedSearch(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.fixedSearch.set(target?.value ?? '');
  }

  onFixedPropertyFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    this.fixedPropertyFilter.set(target?.value ?? '');
  }

  onFixedDateFilterInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.fixedDateFilter.set(target?.value ?? '');
  }

  clearFixedFilters(): void {
    this.fixedSearch.set('');
    this.fixedPropertyFilter.set('');
    this.fixedDateFilter.set('');
  }

  openShiftDetail(shift: FixedShiftCard): void {
    this.selectedShiftDetail.set(shift);
  }

  closeShiftDetail(): void {
    this.selectedShiftDetail.set(null);
    this.isEditingDetail.set(false);
    this.isConfirmEditModalOpen.set(false);
    this.isConfirmDeleteModalOpen.set(false);
  }

  startEditingDetail(): void {
    const detail = this.selectedShiftDetail();
    if (!detail) return;

    this.editShiftNameValue = detail.name;
    this.editStartDateValue = detail.startDate || '';
    this.editEndDateValue = detail.endDate || '';
    this.editNotesValue = detail.notes || '';

    const [start, end] = detail.timeRange.split('-').map(t => t.trim());
    this.editStartHourValue = start;
    this.editEndHourValue = end;

    this.isEditingDetail.set(true);
  }

  cancelEditingDetail(): void {
    this.isEditingDetail.set(false);
  }

  openConfirmEditModal(): void {
    this.isConfirmEditModalOpen.set(true);
  }

  closeConfirmEditModal(): void {
    this.isConfirmEditModalOpen.set(false);
  }

  openConfirmDeleteModal(): void {
    this.isConfirmDeleteModalOpen.set(true);
  }

  closeConfirmDeleteModal(): void {
    this.isConfirmDeleteModalOpen.set(false);
  }

  confirmDeleteShift(): void {
    const detail = this.selectedShiftDetail();
    if (!detail?.id) {
      this.showNotification('Error: ID del turno no encontrado', 'error');
      return;
    }

    this.isDeleting.set(true);
    this.deleteShiftUseCase.execute(detail.id.toString()).subscribe({
      next: () => {
        this.showNotification('Turno eliminado correctamente', 'success');
        this.isDeleting.set(false);
        this.closeConfirmDeleteModal();
        this.closeShiftDetail();
        this.loadFixedShifts();
      },
      error: () => {
        this.showNotification('Error al eliminar el turno', 'error');
        this.isDeleting.set(false);
      }
    });
  }

  confirmUpdateShift(): void {
    const detail = this.selectedShiftDetail();
    if (!detail?.id || !detail?.propertyId) {
      this.showNotification('Error: Información del turno incompleta', 'error');
      return;
    }

    this.isUpdating.set(true);
    const updateData = {
      name: this.editShiftNameValue,
      propertyId: detail.propertyId,
      startDate: this.editStartDateValue,
      endDate: this.editEndDateValue,
      startHour: this.editStartHourValue,
      endHour: this.editEndHourValue,
      notes: this.editNotesValue
    };

    this.updateShiftUseCase.execute(detail.id.toString(), updateData).subscribe({
      next: () => {
        this.showNotification('Turno actualizado correctamente', 'success');
        this.loadFixedShifts();
        this.closeShiftDetail();
        this.isUpdating.set(false);
      },
      error: () => {
        this.showNotification('Error al actualizar el turno', 'error');
        this.isUpdating.set(false);
        this.closeConfirmEditModal();
      }
    });
  }

  showNotification(message: string, type: 'error' | 'success' = 'error'): void {
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
    this.notification.set({ message, type });
    this.notificationTimeout = setTimeout(() => {
      this.notification.set(null);
    }, 5000);
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
    const value = target?.value ?? null;
    this.assignmentShiftId.set(value);
  }

  createAssignment(): void {
    const dateIso = this.assignmentDate().trim();
    const propertyName = this.assignmentProperty().trim();
    const employeeName = this.assignmentEmployee().trim();
    const shiftId = this.assignmentShiftId();

    if (!dateIso || !propertyName || !employeeName || shiftId === null) {
      this.showNotification(
        'Completa fecha, propiedad, empleado y turno para crear la asignacion.'
      );
      return;
    }

    const selectedShift = this.fixedShifts().find((shift) => shift.id === shiftId);
    if (!selectedShift) {
      this.showNotification('El turno seleccionado no es valido.');
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
      this.showNotification('Ingresa un nombre para el turno.');
      return;
    }

    if (!propertyId) {
      this.showNotification('Selecciona una propiedad.');
      return;
    }
    if (!startDate || !endDate) {
      this.showNotification('Completa las fechas de inicio y fin del turno.');
      return;
    }
    const today = this.todayIso();
    if (startDate < today) {
      this.showNotification('La fecha de inicio no puede ser una fecha pasada.');
      return;
    }
    if (endDate < today) {
      this.showNotification('La fecha de fin no puede ser una fecha pasada.');
      return;
    }
    if (startDate > endDate) {
      this.showNotification('La fecha de inicio no puede ser posterior a la fecha de fin.');
      return;
    }
    if (!startHour || !endHour) {
      this.showNotification('Completa el horario de inicio y salida del turno.');
      return;
    }

    if (startHour === endHour) {
      this.showNotification('La hora de inicio y salida no pueden ser iguales.');
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
          this.showNotification('Turno creado exitosamente.', 'success');
          this.loadFixedShifts(); // Refresh the list from server
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
          this.showNotification(message);
          this.isCreatingShift.set(false);
        },
      });
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
