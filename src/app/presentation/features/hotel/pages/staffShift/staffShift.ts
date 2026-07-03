import { switchMap, catchError, EMPTY } from 'rxjs';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { HotelPageLayoutComponent } from '@/presentation/features/hotel/components/hotel-page-layout/hotel-page-layout';
import { ToastService } from '@/presentation/shared/services/toast.service';
import { ToastComponent } from '@/presentation/shared/components/toast/toast.component';
import { ShiftDatePickerComponent } from '@/presentation/shared/components/shift-date-picker/shift-date-picker.component';
import { TutorialService } from '@/presentation/shared/services/tutorial.service';
import { TutorialHighlightDirective } from '@/presentation/shared/directives/tutorial-highlight.directive';
import { translateHttpError } from '@/presentation/shared/utils/http-error-translator';
import { SHIFT_BACKEND_MESSAGES } from '@/domain/constants/shift-messages.constants';
import { CreateShiftUseCase } from '@/domain/use-cases/shift/create-shift.use-case';
import { GetShiftsUseCase } from '@/domain/use-cases/shift/get-shifts.use-case';
import { GetStaffUseCase } from '@/domain/use-cases/staff/get-staff.use-case';
import { UpdateShiftUseCase } from '@/domain/use-cases/shift/update-shift.use-case';
import { DeleteShiftUseCase } from '@/domain/use-cases/shift/delete-shift.use-case';
import { AssignStaffToShiftUseCase } from '@/domain/use-cases/shift/assign-staff.use-case';
import { UnassignStaffFromShiftUseCase } from '@/domain/use-cases/shift/unassign-staff.use-case';
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
  bootstrapSearch,
  bootstrapPersonPlusFill,
  bootstrapCalendar3,
  bootstrapPersonX,
  bootstrapBuilding,
  bootstrapCalendarEvent,
  bootstrapCalendarX,
  bootstrapPersonDash,
  bootstrapChevronDown,
  bootstrapX,
  bootstrapPerson,
  bootstrapEraser,
} from '@ng-icons/bootstrap-icons';

type PreviewTab = 'calendar' | 'assignments';

interface DayAssignment {
  employeeName: string;
  employeeInitials: string;
  propertyName: string;
  shiftName: string;
  shiftTime: string;
  colorIndex?: number;
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
  staffMemberIds?: string[];
  colorIndex?: number;
}

interface ShiftOption {
  id: string | number;
  name: string;
  timeRange: string;
}

@Component({
  selector: 'app-staff-shift',
  standalone: true,
  imports: [HotelPageLayoutComponent, FormsModule, NgIconComponent, ToastComponent, ShiftDatePickerComponent, TutorialHighlightDirective],
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
      bootstrapSearch,
      bootstrapPersonPlusFill,
      bootstrapCalendar3,
      bootstrapPersonX,
      bootstrapBuilding,
      bootstrapCalendarEvent,
      bootstrapCalendarX,
      bootstrapPersonDash,
      bootstrapChevronDown,
      bootstrapX,
      bootstrapPerson,
      bootstrapEraser,
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
  private readonly assignStaffToShiftUseCase = inject(AssignStaffToShiftUseCase);
  private readonly unassignStaffFromShiftUseCase = inject(UnassignStaffFromShiftUseCase);
  private readonly getStaffUseCase = inject(GetStaffUseCase);
  private readonly staffRepository = inject(StaffRepository);
  private readonly toastService = inject(ToastService);
  private readonly tutorialService = inject(TutorialService);

  private shiftCreated = false;
  private assignmentCreated = false;

  // ── Tab navigation ──────────────────────────────────────────────────────────
  readonly activeTab = signal<PreviewTab>('calendar');

  // ── Calendar tab ────────────────────────────────────────────────────────────
  readonly calendarSearch = signal('');
  readonly calendarPropertyFilter = signal('');
  readonly calendarShiftTypeFilter = signal('');

  readonly isCreateAssignmentModalOpen = signal(false);
  readonly isCalendarOverviewModalOpen = signal(false);
  readonly overviewWeekStart = signal<Date>(this.getStartOfWeek(new Date()));

  readonly assignmentProperty = signal('');
  readonly assignmentEmployee = signal('');
  readonly assignmentShiftId = signal<string | number | null>(null);

  readonly isEmployeeSelectorModalOpen = signal(false);
  readonly employeeSearch = signal('');

  readonly fixedSearch = signal('');
  readonly fixedPropertyFilter = signal('');
  readonly fixedDateFilter = signal('');

  readonly selectedShiftDetail = signal<FixedShiftCard | null>(null);

  readonly isCreateModalOpen = signal(false);
  readonly isOverviewDatePickerOpen = signal(false);

  readonly overviewSelectedDay = signal(new Date().getDate());
  readonly overviewSelectedMonth = signal(new Date().getMonth());
  readonly overviewSelectedYear = signal(new Date().getFullYear());

  readonly daysArray = Array.from({ length: 31 }, (_, i) => i + 1);
  readonly monthsArray = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  readonly yearsArray = Array.from({ length: 11 }, (_, i) => 2020 + i);

  readonly currentWeekStart = signal<Date>(this.getStartOfWeek(new Date()));

  readonly newShiftStaffMemberIds = signal<string[]>([]);
  readonly newShiftPropertyId = signal('');
  readonly newShiftStartDate = signal('');
  readonly newShiftEndDate = signal('');
  readonly newShiftStart = signal('');
  readonly newShiftEnd = signal('');
  readonly newShiftNotes = signal('');

  readonly newShiftName = signal('');

  readonly staffMembers = signal<StaffMember[]>([]);
  readonly properties = signal<Property[]>([]);
  readonly isCreatingShift = signal(false);
  readonly isEditingDetail = signal(false);
  readonly isConfirmEditModalOpen = signal(false);
  readonly isConfirmDeleteModalOpen = signal(false);
  readonly isConfirmUnassignModalOpen = signal(false);
  readonly isChangeShiftModalOpen = signal(false);
  readonly isConfirmChangeModalOpen = signal(false);
  readonly changeShiftCurrentStarted = signal(false);
  readonly staffToUnassign = signal<{ shiftId: string; staffId: string; staffName: string } | null>(null);
  readonly staffToChangeShift = signal<{ currentShiftId: string; currentShiftName: string; staffId: string; staffName: string } | null>(null);
  readonly newSelectedShiftId = signal<string | null>(null);
  readonly isUpdating = signal(false);
  readonly isDeleting = signal(false);
  readonly isAssigning = signal(false);
  readonly isUnassigning = signal(false);
  readonly isChangingShift = signal(false);

  readonly changeShiftOptions = computed<FixedShiftCard[]>(() => {
    const data = this.staffToChangeShift();
    const allShifts = this.fixedShifts();
    const staffMembers = this.staffMembers();

    if (!data) return [];

    const member = staffMembers.find(m => m.id === data.staffId);
    if (!member) return allShifts;

    return allShifts.filter(shift => {
      if (!shift.propertyId) return true;
      return this.checkStaffHasProperty(member, shift.propertyId);
    });
  });

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

  constructor() {
    effect(() => {
      if (!this.tutorialService.isActive()) return;
      const modal = this.tutorialService.requestedShiftModal();
      if (!modal) return;

      if (modal === 'create' && this.tutorialService.currentStep() === 5) {
        if (this.isCreateAssignmentModalOpen()) {
          this.closeCreateAssignmentModal();
        }
        this.openCreateShiftModal();
      } else if (modal === 'assign' && this.tutorialService.currentStep() === 6) {
        if (this.isCreateModalOpen()) {
          this.closeCreateShiftModal();
        }
        this.showAssignmentsTab();
        this.openCreateAssignmentModal();
      }

      this.tutorialService.clearRequestedShiftModal();
    });
  }

  readonly assignmentDays = computed<AssignmentDay[]>(() => {
    const shifts = this.fixedShifts();
    const staff = this.staffMembers();
    const results: AssignmentDay[] = [];

    const start = new Date(this.currentWeekStart());

    for (let i = 0; i < 14; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const iso = `${yyyy}-${mm}-${dd}`;

      const dayAssignments: DayAssignment[] = [];

      shifts.forEach(shift => {
        if (shift.startDate && shift.endDate && iso >= shift.startDate && iso <= shift.endDate) {
          shift.staffMemberIds?.forEach(empId => {
            const member = staff.find(m => m.id === empId);
            if (member) {
              dayAssignments.push({
                employeeName: member.fullName || member.name || member.email,
                employeeInitials: this.buildEmployeeInitials(member.fullName || member.name || member.email),
                propertyName: shift.propertyName || 'N/A',
                shiftName: shift.name,
                shiftTime: shift.timeRange,
                colorIndex: shift.colorIndex
              });
            }
          });
        }
      });

      if (dayAssignments.length > 0) {
        results.push({
          dateIso: iso,
          dateLabel: this.formatDateLabel(iso),
          assignments: dayAssignments
        });
      }
    }

    return results;
  });

  readonly fixedShifts = signal<FixedShiftCard[]>([]);

  readonly filteredAssignmentDays = computed<AssignmentDay[]>(() => {
    const query = this.normalizeText(this.calendarSearch());

    let filteredDays = this.assignmentDays();

    if (!query) {
      return filteredDays;
    }

    return filteredDays
      .map((day) => ({
        ...day,
        assignments: day.assignments.filter((assignment) => {
          const searchable = [
            assignment.employeeName,
            assignment.shiftName,
          ]
            .map((value) => this.normalizeText(value))
            .join(' ');

          return searchable.includes(query);
        }),
      }))
      .filter((day) => day.assignments.length > 0);
  });

  readonly calendarPropertyOptions = computed<string[]>(() => {
    return this.properties().map(p => p.name).sort((a, b) => a.localeCompare(b));
  });

  readonly calendarShiftTypeOptions = computed<string[]>(() => {
    const propFilter = this.calendarPropertyFilter();
    const shiftSet = new Set<string>();
    this.assignmentDays().forEach((day) => {
      day.assignments.forEach((assignment) => {
        if (!propFilter || assignment.propertyName === propFilter) {
          if (assignment.shiftName.trim()) {
            shiftSet.add(assignment.shiftName);
          }
        }
      });
    });
    return Array.from(shiftSet).sort((a, b) => a.localeCompare(b));
  });

  readonly filteredStaffByProperty = computed(() => {
    const propFilter = this.calendarPropertyFilter();
    const query = this.normalizeText(this.calendarSearch());
    const shiftFilter = this.calendarShiftTypeFilter();
    const colors = ['primary', 'success', 'warning', 'danger', 'info'];

    const results = this.staffMembers()
      .filter(member => {
        const memberName = member.fullName || member.name || member.email;
        if (query && !this.normalizeText(memberName).includes(query)) return false;

        if (propFilter) {
          const propObj = this.properties().find(p => p.name === propFilter);
          if (propObj && !this.checkStaffHasProperty(member, propObj.id)) return false;
        }
        return true;
      })
      .flatMap((member, idx) => {
        const memberName = member.fullName || member.name || member.email;
        const initials = this.buildEmployeeInitials(memberName);
        const propNames = this.getStaffMemberPropertyNames(member);
        const avatarColor = colors[idx % colors.length];

        return this.getStaffShiftEntries(member, memberName, initials, propNames, shiftFilter, avatarColor);
      });

    return results.sort((a, b) => a.employeeName.localeCompare(b.employeeName));
  });

  private getStaffShiftEntries(
    member: StaffMember,
    memberName: string,
    initials: string,
    propNames: string,
    shiftFilter: string,
    avatarColor: string
  ): any[] {
    const memberShifts = this.fixedShifts().filter(s => s.staffMemberIds?.includes(member.id || ''));

    if (memberShifts.length > 0) {
      return memberShifts
        .filter(s => !shiftFilter || s.name === shiftFilter)
        .map(s => ({
          employeeName: memberName,
          employeeInitials: initials,
          avatarColor,
          propertyName: propNames,
          shiftName: s.name,
          shiftTime: s.timeRange,
          dateLabel: this.getShiftDateRangeLabel(s),
          dateIso: s.startDate,
          shiftId: s.id,
          staffId: member.id
        }));
    }

    return [];
  }

  private getShiftDateRangeLabel(shift: FixedShiftCard): string {
    if (!shift.startDate || !shift.endDate) return 'No asignado';
    const start = new Date(`${shift.startDate}T00:00:00`);
    const end = new Date(`${shift.endDate}T00:00:00`);
    const formatter = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' });
    return `Del ${formatter.format(start)} al ${formatter.format(end)}`;
  }

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

  readonly assignmentShiftOptions = computed<FixedShiftCard[]>(() => {
    const propFilter = this.assignmentProperty();
    const allShifts = this.fixedShifts();

    if (!propFilter) return [];
    if (propFilter === 'ALL') return allShifts;

    return allShifts.filter(shift => shift.propertyId === propFilter);
  });



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

  getShiftColorClass(shift: FixedShiftCard | { colorIndex?: number; shiftName?: string; shiftId?: string }): string {
    const colors = ['gantt-bar--1', 'gantt-bar--2', 'gantt-bar--3', 'gantt-bar--4', 'gantt-bar--5'];
    if (shift.colorIndex !== undefined) {
      return colors[shift.colorIndex % colors.length];
    }
    if ('shiftId' in shift && typeof shift.shiftId === 'string') {
      const hash = Array.from(shift.shiftId).reduce((acc: number, char: string) => acc + (char.codePointAt(0) || 0), 0);
      return colors[hash % colors.length];
    }
    if ('shiftName' in shift && typeof shift.shiftName === 'string') {
      const hash = Array.from(shift.shiftName).reduce((acc: number, char: string) => acc + (char.codePointAt(0) || 0), 0);
      return colors[hash % colors.length];
    }
    if ('id' in shift) {
      const id = shift.id;
      const hash = typeof id === 'string'
        ? Array.from(id).reduce((acc: number, char: string) => acc + (char.codePointAt(0) || 0), 0)
        : id;
      return colors[(hash || 0) % colors.length];
    }
    return colors[0];
  }

  readonly ganttDaysOverview = computed(() => {
    const days = [];
    const start = new Date(this.overviewWeekStart());
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

  readonly weekDateRangeLabelOverview = computed(() => {
    const days = this.ganttDaysOverview();
    if (days.length === 0) return '';
    const start = new Date(`${days[0].iso}T00:00:00`);
    const end = new Date(`${days[6].iso}T00:00:00`);
    const formatter = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' });
    return `Del ${formatter.format(start)} al ${formatter.format(end)}`;
  });

  nextWeekOverview(): void {
    const next = new Date(this.overviewWeekStart());
    next.setDate(next.getDate() + 7);
    this.overviewWeekStart.set(next);
  }

  prevWeekOverview(): void {
    const prev = new Date(this.overviewWeekStart());
    prev.setDate(prev.getDate() - 7);
    this.overviewWeekStart.set(prev);
  }

  getOverviewAssignmentsForDay(dateIso: string) {
    const segments: { id: string; employeeName: string; shiftName: string; timeRange: string; gridColumn: string, shiftId: string, colorIndex?: number }[] = [];
    const dayData = this.assignmentDays().find(d => d.dateIso === dateIso);

    if (!dayData) return segments;

    dayData.assignments.forEach((assignment, index) => {
      const [startH, startM, endH, endM] = this.parseTimeRange(assignment.shiftTime);
      const startQuarter = Math.round((startH * 60 + startM) / 15);
      const endQuarter = Math.round((endH * 60 + endM) / 15);

      let gridCol = '';
      if (startQuarter < endQuarter) {
        gridCol = `${startQuarter + 1} / ${endQuarter + 1}`;
      } else {
        gridCol = `${startQuarter + 1} / 97`;
      }

      segments.push({
        id: `overview-${dateIso}-${index}`,
        employeeName: assignment.employeeName,
        shiftName: assignment.shiftName,
        timeRange: assignment.shiftTime,
        gridColumn: gridCol,
        shiftId: assignment.shiftName,
        colorIndex: assignment.colorIndex
      });
    });

    return segments;
  }

  ngOnInit(): void {
    this.loadStaff();
    this.loadProperties();
  }

  private loadStaff(): void {
    this.getStaffUseCase.execute().subscribe({
      next: (members) => {
        const normalized = members.map((m: any) => ({
          ...m,
          id: m.id || m._id || m.userId || ''
        }));
        this.staffMembers.set(normalized);
      },
      error: () => this.staffMembers.set([]),
    });
  }

  private loadProperties(): void {
    this.staffRepository.getProperties().subscribe({
      next: (response) => {
        const data = response.data ?? [];
        const normalizedData = data.map((p: any) => ({
          ...p,
          id: p.id || p._id || p.propertyId || ''
        }));
        this.properties.set(normalizedData);
        if (normalizedData.length > 0 && !this.newShiftPropertyId()) {
          this.newShiftPropertyId.set(normalizedData[0].id);
        }
        this.loadFixedShifts();
      },
      error: () => {
        this.properties.set([]);
        this.loadFixedShifts();
      }
    });
  }

  private loadFixedShifts(): void {
    this.getShiftsUseCase.execute().subscribe({
      next: (shifts) => {
        const mappedShifts: FixedShiftCard[] = shifts.map((s: any) => {
          const id = s.id || s._id || s.shiftId || '';
          const propertyId = s.propertyId || s.property_id || '';
          const colorIndex = typeof id === 'string'
            ? Array.from(id).reduce((acc, char) => acc + (char.codePointAt(0) || 0), 0) % 5
            : Math.floor(Math.random() * 5);

          return {
            id,
            name: s.name,
            timeRange: `${s.startHour} - ${s.endHour}`,
            startDate: s.startDate ? s.startDate.split('T')[0] : '',
            endDate: s.endDate ? s.endDate.split('T')[0] : '',
            propertyName: this.properties().find(p => p.id === propertyId)?.name ?? 'N/A',
            propertyId: propertyId,
            notes: s.notes,
            staffMemberIds: s.staffMemberIds || [],
            colorIndex
          };
        });
        this.fixedShifts.set(mappedShifts.filter(s => s.id));
      },
      error: () => this.fixedShifts.set([])
    });
  }

  showCalendarTab(): void {
    this.activeTab.set('calendar');
  }

  showAssignmentsTab(): void {
    this.activeTab.set('assignments');
  }

  onCalendarSearch(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.calendarSearch.set(target?.value ?? '');
  }

  clearCalendarSearch(): void {
    this.calendarSearch.set('');
  }

  onCalendarShiftTypeFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    this.calendarShiftTypeFilter.set(target?.value ?? '');
  }

  onCalendarPropertyFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    this.calendarPropertyFilter.set(target?.value ?? '');
    this.calendarShiftTypeFilter.set(''); // Reset shift filter when property changes
  }

  toggleOverviewDatePicker(): void {
    this.isOverviewDatePickerOpen.update(v => !v);
  }

  onOverviewDaySelect(day: number): void {
    this.overviewSelectedDay.set(day);
  }

  onOverviewMonthSelect(month: number): void {
    this.overviewSelectedMonth.set(month);
  }

  onOverviewYearSelect(year: number): void {
    this.overviewSelectedYear.set(year);
  }

  applyOverviewDateSelection(): void {
    const selectedDate = new Date(this.overviewSelectedYear(), this.overviewSelectedMonth(), this.overviewSelectedDay());
    this.overviewWeekStart.set(this.getStartOfWeek(selectedDate));
    this.isOverviewDatePickerOpen.set(false);
  }

  isDateLocked(dateStr: string | null | undefined): boolean {
    if (!dateStr) return false;
    return dateStr <= this.todayIso();
  }

  onFixedSearch(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    const query = target?.value ?? '';
    this.fixedSearch.set(query);

    if (query.trim().length >= 3) {
      const normalizedQuery = this.normalizeText(query);
      const match = this.fixedShifts().find(s =>
        this.normalizeText(s.name).includes(normalizedQuery)
      );

      if (match?.startDate) {
        const matchDate = new Date(`${match.startDate}T00:00:00`);
        this.currentWeekStart.set(this.getStartOfWeek(matchDate));
      }
    } else if (query.trim().length === 0) {
      this.currentWeekStart.set(this.getStartOfWeek(new Date()));
    }
  }

  clearFixedSearch(): void {
    this.fixedSearch.set('');
    this.currentWeekStart.set(this.getStartOfWeek(new Date()));
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
    this.currentWeekStart.set(this.getStartOfWeek(new Date()));
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

  openConfirmUnassignModal(shiftId: string | number, staffId: string, staffName: string): void {
    this.staffToUnassign.set({ shiftId: shiftId.toString(), staffId, staffName });
    this.isConfirmUnassignModalOpen.set(true);
  }

  closeConfirmUnassignModal(): void {
    this.isConfirmUnassignModalOpen.set(false);
    this.staffToUnassign.set(null);
  }

  openChangeShiftModal(currentShiftId: string | number, currentShiftName: string, staffId: string, staffName: string): void {
    this.staffToChangeShift.set({
      currentShiftId: currentShiftId.toString(),
      currentShiftName,
      staffId,
      staffName
    });
    this.newSelectedShiftId.set(null);
    this.isChangeShiftModalOpen.set(true);
  }

  closeChangeShiftModal(): void {
    this.isChangeShiftModalOpen.set(false);
    this.isConfirmChangeModalOpen.set(false);
    this.changeShiftCurrentStarted.set(false);
    this.staffToChangeShift.set(null);
    this.newSelectedShiftId.set(null);
  }

  selectNewShift(shiftId: string | number): void {
    const data = this.staffToChangeShift();
    if (!data) return;

    this.newSelectedShiftId.set(shiftId.toString());

    const currentShift = this.fixedShifts().find(s => s.id.toString() === data.currentShiftId);
    this.changeShiftCurrentStarted.set(!!currentShift && this.isShiftStarted(currentShift));
    this.isConfirmChangeModalOpen.set(true);
  }

  closeConfirmChangeModal(): void {
    this.isConfirmChangeModalOpen.set(false);
  }

  confirmChangeShift(): void {
    const data = this.staffToChangeShift();
    const newId = this.newSelectedShiftId();
    if (!data || !newId) return;

    this.isChangingShift.set(true);
    this.unassignStaffFromShiftUseCase.execute(data.currentShiftId, [data.staffId]).pipe(
      switchMap(() =>
        this.assignStaffToShiftUseCase.execute(newId, [data.staffId]).pipe(
          catchError(() => {
            this.toastService.error(
              'El turno anterior fue desasignado pero no se pudo asignar el nuevo turno. Revisá el estado del empleado.'
            );
            this.loadFixedShifts();
            this.closeConfirmChangeModal();
            this.closeChangeShiftModal();
            this.isChangingShift.set(false);
            return EMPTY;
          })
        )
      )
    ).subscribe({
      next: () => {
        this.toastService.success('Turno cambiado correctamente.');
        this.loadFixedShifts();
        this.closeConfirmChangeModal();
        this.closeChangeShiftModal();
        this.isChangingShift.set(false);
      },
      error: (err: unknown) => {
        this.toastService.error(translateHttpError(err, SHIFT_BACKEND_MESSAGES, 'No se pudo desasignar el turno actual. Intentá de nuevo.'));
        this.isChangingShift.set(false);
      }
    });
  }

  confirmUnassignStaff(): void {
    const data = this.staffToUnassign();
    if (!data) return;

    this.isUnassigning.set(true);
    this.unassignStaffFromShiftUseCase.execute(data.shiftId, [data.staffId]).subscribe({
      next: () => {
        this.toastService.success('Empleado desasignado correctamente.');
        this.loadFixedShifts();
        this.closeConfirmUnassignModal();
        this.isUnassigning.set(false);
      },
      error: (err: unknown) => {
        this.toastService.error(translateHttpError(err, SHIFT_BACKEND_MESSAGES));
        this.isUnassigning.set(false);
      }
    });
  }

  confirmDeleteShift(): void {
    const detail = this.selectedShiftDetail();
    if (!detail?.id) {
      this.toastService.error('No se encontró el turno.');
      return;
    }

    this.isDeleting.set(true);
    this.deleteShiftUseCase.execute(detail.id.toString()).subscribe({
      next: () => {
        this.toastService.success('Turno eliminado correctamente.');
        this.isDeleting.set(false);
        this.closeConfirmDeleteModal();
        this.closeShiftDetail();
        this.loadFixedShifts();
      },
      error: (err: unknown) => {
        this.toastService.error(translateHttpError(err, SHIFT_BACKEND_MESSAGES));
        this.isDeleting.set(false);
      }
    });
  }

  confirmUpdateShift(): void {
    const detail = this.selectedShiftDetail();
    if (!detail?.id || !detail?.propertyId) {
      this.toastService.error('Información del turno incompleta.');
      return;
    }

    const validationErrors = this.validateEditShift();
    if (validationErrors.length > 0) {
      validationErrors.forEach((message) => this.toastService.error(message));
      this.closeConfirmEditModal();
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
        this.toastService.success('Turno actualizado correctamente.');
        this.loadFixedShifts();
        this.closeShiftDetail();
        this.isUpdating.set(false);
      },
      error: (err: unknown) => {
        this.toastService.error(translateHttpError(err, SHIFT_BACKEND_MESSAGES));
        this.isUpdating.set(false);
        this.closeConfirmEditModal();
      }
    });
  }

  openCreateAssignmentModal(): void {
    this.isCreateAssignmentModalOpen.set(true);
    this.assignmentProperty.set('');
    this.assignmentEmployee.set('');
    this.assignmentShiftId.set(null);
  }

  closeCreateAssignmentModal(): void {
    this.isCreateAssignmentModalOpen.set(false);
    if (!this.assignmentCreated) {
      this.tutorialService.resetActionButtonClicked(6);
    }
    this.assignmentCreated = false;
    this.resetCreateAssignmentForm();
  }

  onAssignmentPropertyChange(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    const newProp = target?.value ?? '';
    this.assignmentProperty.set(newProp);

    const empId = this.assignmentEmployee();
    if (empId && newProp && newProp !== 'ALL') {
      const emp = this.staffMembers().find(e => e.id === empId);
      if (emp) {
        let hasAccess = false;
        emp.roleAssignments?.forEach((ra: any) => {
          if (ra.scope?.type === 'TENANT') {
            hasAccess = true;
          } else if (ra.scope?.type === 'PROPERTY' && Array.isArray(ra.scope.resourceIds)) {
            if (ra.scope.resourceIds.includes(newProp)) hasAccess = true;
          }
        });
        if (!hasAccess) {
          this.assignmentEmployee.set('');
          this.assignmentShiftId.set(null);
        }
      }
    }
  }

  openEmployeeSelectorModal(): void {
    this.isEmployeeSelectorModalOpen.set(true);
    this.employeeSearch.set('');
  }

  closeEmployeeSelectorModal(): void {
    this.isEmployeeSelectorModalOpen.set(false);
  }

  onEmployeeSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.employeeSearch.set(target?.value ?? '');
  }

  getEmployeePropertiesText(employee: StaffMember): string {
    let isTenant = false;
    const names: string[] = [];
    employee.roleAssignments?.forEach((ra: any) => {
      if (ra.scope?.type === 'TENANT') {
        isTenant = true;
      } else if (ra.scope?.type === 'PROPERTY') {
        if (ra.scope.resources && Array.isArray(ra.scope.resources)) {
          ra.scope.resources.forEach((r: any) => { if (r.name) names.push(r.name); });
        } else if (ra.scope.resourceIds && Array.isArray(ra.scope.resourceIds)) {
          ra.scope.resourceIds.forEach((id: string) => {
            const p = this.properties().find(prop => prop.id === id);
            if (p) names.push(p.name);
          });
        }
      }
    });

    if (isTenant) return 'Todas las propiedades (Tenant)';

    if (names.length > 0) {
      return [...new Set(names)].join(', ');
    }
    return 'Sin propiedad';
  }

  readonly filteredEmployeesForSelector = computed(() => {
    const search = this.normalizeText(this.employeeSearch());
    const propertyFilter = this.assignmentProperty();
    let staff = this.staffMembers();

    if (propertyFilter && propertyFilter !== 'ALL') {
      staff = staff.filter(emp => {
        let hasAccess = false;
        emp.roleAssignments?.forEach((ra: any) => {
          if (ra.scope?.type === 'TENANT') {
            hasAccess = true;
          } else if (ra.scope?.type === 'PROPERTY' && Array.isArray(ra.scope.resourceIds)) {
            if (ra.scope.resourceIds.includes(propertyFilter)) {
              hasAccess = true;
            }
          }
        });
        return hasAccess;
      });
    }

    if (search) {
      staff = staff.filter(emp => {
        const name = emp.fullName || emp.name || emp.email;
        return this.normalizeText(name).includes(search);
      });
    }

    return staff.sort((a, b) => {
      const nameA = a.fullName || a.name || a.email;
      const nameB = b.fullName || b.name || b.email;
      return nameA.localeCompare(nameB);
    });
  });

  selectEmployee(employeeId: string): void {
    this.assignmentEmployee.set(employeeId);
    this.isEmployeeSelectorModalOpen.set(false);

    const employee = this.staffMembers().find(e => e.id === employeeId);
    if (employee) {
      let isTenant = false;
      const propIds: string[] = [];
      employee.roleAssignments?.forEach((ra: any) => {
        if (ra.scope?.type === 'TENANT') {
          isTenant = true;
        } else if (ra.scope?.type === 'PROPERTY') {
          if (Array.isArray(ra.scope.resourceIds)) {
            propIds.push(...ra.scope.resourceIds);
          }
        }
      });

      if (isTenant) {
        this.assignmentProperty.set('ALL');
      } else if (propIds.length > 0) {
        const currentProp = this.assignmentProperty();
        if (!currentProp || !propIds.includes(currentProp)) {
          this.assignmentProperty.set(propIds[0]);
        }
      }
    }
  }

  clearEmployeeSelection(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.assignmentEmployee.set('');
    this.assignmentShiftId.set(null);
    if (this.assignmentProperty() === 'ALL') {
      this.assignmentProperty.set('');
    }
  }

  getSelectedEmployeeName(): string {
    const empId = this.assignmentEmployee();
    if (!empId) return 'Seleccione un empleado...';
    const emp = this.staffMembers().find(e => e.id === empId);
    if (!emp) return 'Empleado no encontrado';
    return emp.fullName || emp.name || emp.email;
  }

  openCalendarOverviewModal(): void {
    this.isCalendarOverviewModalOpen.set(true);
    this.overviewWeekStart.set(this.getStartOfWeek(new Date()));
  }

  closeCalendarOverviewModal(): void {
    this.isCalendarOverviewModalOpen.set(false);
  }

  onAssignmentEmployeeChange(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    this.assignmentEmployee.set(target?.value ?? '');
  }

  selectAssignmentShift(shiftId: string | number): void {
    this.assignmentShiftId.set(shiftId.toString());
  }

  createAssignment(): void {
    const propertyId = this.assignmentProperty().trim();
    let employeeId = this.assignmentEmployee().trim();
    const shiftId = this.assignmentShiftId();

    const assignmentErrors = this.validateAssignment();
    if (assignmentErrors.length > 0) {
      assignmentErrors.forEach((message) => this.toastService.error(message));
      return;
    }

    const shift = this.fixedShifts().find(s => s.id === shiftId);
    if (!shift) {
      this.toastService.error('El turno seleccionado no es válido.');
      return;
    }

    const today = this.todayIso();
    if (shift.startDate && shift.startDate < today) {
      this.toastService.error('No se puede asignar un turno con fecha de inicio pasada.');
      return;
    }
    if (shift.endDate && shift.endDate < today) {
      this.toastService.error('No se puede asignar un turno con fecha de fin pasada.');
      return;
    }

    const newStartStr = shift.startDate;
    const newEndStr = shift.endDate;

    if (newStartStr && newEndStr) {
      const newStart = new Date(newStartStr + 'T00:00:00');
      const newEnd = new Date(newEndStr + 'T00:00:00');

      const conflictingShift = this.fixedShifts().find(s => {
        if (!s.staffMemberIds?.includes(employeeId) || !s.startDate || !s.endDate) return false;

        const existingStart = new Date(s.startDate + 'T00:00:00');
        const existingEnd = new Date(s.endDate + 'T00:00:00');

        return newStart <= existingEnd && newEnd >= existingStart;
      });

      if (conflictingShift) {
        this.toastService.error(
          `Conflicto: El empleado ya tiene el turno "${conflictingShift.name}" del ${conflictingShift.startDate} al ${conflictingShift.endDate}.`
        );
        return;
      }
    }

    this.isAssigning.set(true);
    this.assignStaffToShiftUseCase.execute(shiftId!.toString(), [employeeId]).subscribe({
      next: () => {
        this.assignmentCreated = true;
        this.toastService.success('Turno asignado correctamente.');
        this.loadFixedShifts();
        this.closeCreateAssignmentModal();
        this.isAssigning.set(false);
        this.tutorialService.stepCompleted$.next();
      },
      error: (err: unknown) => {
        this.toastService.error(translateHttpError(err, SHIFT_BACKEND_MESSAGES));
        this.isAssigning.set(false);
      }
    });
  }

  openCreateShiftModal(): void {
    this.isCreateModalOpen.set(true);
    if (!this.newShiftPropertyId() && this.properties().length > 0) {
      this.newShiftPropertyId.set(this.properties()[0].id);
    }
  }

  closeCreateShiftModal(): void {
    this.isCreateModalOpen.set(false);
    if (!this.shiftCreated) {
      this.tutorialService.resetActionButtonClicked(5);
    }
    this.shiftCreated = false;
    this.resetCreateShiftForm();
  }

  getStaffNames(ids?: string[]): string[] {
    if (!ids || !Array.isArray(ids)) return [];
    return ids.map(id => {
      const member = this.staffMembers().find(m => m.id === id);
      return member ? (member.fullName || member.name || member.email) : 'Empleado desconocido';
    });
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

  onNewShiftStartDateInput(value: string): void {
    this.newShiftStartDate.set(value);
  }

  onNewShiftEndDateInput(value: string): void {
    this.newShiftEndDate.set(value);
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
    const validationErrors = this.validateCreateShift();
    if (validationErrors.length > 0) {
      validationErrors.forEach((message) => this.toastService.error(message));
      return;
    }

    const name = this.newShiftName().trim();
    const staffMemberIds = this.newShiftStaffMemberIds();
    const propertyId = this.newShiftPropertyId().trim();
    const startDate = this.newShiftStartDate().trim();
    const endDate = this.newShiftEndDate().trim();
    const startHour = this.newShiftStart().trim();
    const endHour = this.newShiftEnd().trim();
    const notes = this.newShiftNotes().trim();

    this.isCreatingShift.set(true);

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
        this.shiftCreated = true;
        this.toastService.success('Turno creado correctamente.');
        this.loadFixedShifts();
        this.isCreatingShift.set(false);
        this.closeCreateShiftModal();
        this.tutorialService.stepCompleted$.next();
      },
        error: (err: unknown) => {
          this.toastService.error(translateHttpError(err, SHIFT_BACKEND_MESSAGES));
          this.isCreatingShift.set(false);
        },
      });
  }

  private validateCreateShift(): string[] {
    const errors: string[] = [];
    const name = this.newShiftName().trim();
    const propertyId = this.newShiftPropertyId().trim();
    const startDate = this.newShiftStartDate().trim();
    const endDate = this.newShiftEndDate().trim();
    const startHour = this.newShiftStart().trim();
    const endHour = this.newShiftEnd().trim();
    const today = this.todayIso();

    if (!name) errors.push('El nombre del turno es obligatorio.');
    if (!propertyId) errors.push('Seleccioná una propiedad.');
    if (!startDate) errors.push('La fecha de inicio es obligatoria.');
    if (!endDate) errors.push('La fecha de fin es obligatoria.');
    if (startDate && startDate < today) errors.push('La fecha de inicio no puede ser una fecha pasada.');
    if (endDate && endDate < today) errors.push('La fecha de fin no puede ser una fecha pasada.');
    if (startDate && endDate && startDate > endDate) errors.push('La fecha de inicio no puede ser posterior a la fecha de fin.');
    if (!startHour) errors.push('La hora de inicio es obligatoria.');
    if (!endHour) errors.push('La hora de fin es obligatoria.');
    if (startHour && endHour && startHour === endHour) errors.push('La hora de inicio y de fin no pueden ser iguales.');

    return errors;
  }

  private validateEditShift(): string[] {
    const errors: string[] = [];

    if (!this.editShiftNameValue.trim()) errors.push('El nombre del turno es obligatorio.');
    if (!this.editStartDateValue.trim()) errors.push('La fecha de inicio es obligatoria.');
    if (!this.editEndDateValue.trim()) errors.push('La fecha de fin es obligatoria.');
    if (this.editStartDateValue && this.editEndDateValue && this.editStartDateValue > this.editEndDateValue) {
      errors.push('La fecha de inicio no puede ser posterior a la fecha de fin.');
    }
    if (!this.editStartHourValue.trim()) errors.push('La hora de inicio es obligatoria.');
    if (!this.editEndHourValue.trim()) errors.push('La hora de fin es obligatoria.');
    if (this.editStartHourValue && this.editEndHourValue && this.editStartHourValue === this.editEndHourValue) {
      errors.push('La hora de inicio y de fin no pueden ser iguales.');
    }

    return errors;
  }

  private validateAssignment(): string[] {
    const errors: string[] = [];
    const propertyId = this.assignmentProperty().trim();
    const employeeId = this.assignmentEmployee().trim();
    const shiftId = this.assignmentShiftId();

    if (!propertyId) errors.push('Seleccioná una propiedad.');
    if (!employeeId) errors.push('Seleccioná un empleado.');
    if (shiftId === null || shiftId === '') errors.push('Seleccioná un turno.');

    return errors;
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
    this.isCreatingShift.set(false);
  }

  private resetCreateAssignmentForm(): void {
    this.assignmentProperty.set('');
    this.assignmentEmployee.set('');
    this.assignmentShiftId.set(null);
  }

  formatShortDate(dateIso: string | null | undefined): string {
    if (!dateIso) return 'N/A';
    const date = new Date(`${dateIso}T00:00:00`);
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
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

  private getStaffMemberPropertyNames(member: StaffMember): string {
    if (!member.roleAssignments || member.roleAssignments.length === 0) {
      return 'Sin propiedad asignada';
    }

    let isTenant = false;
    const names: string[] = [];

    member.roleAssignments.forEach((ra: any) => {
      if (ra.scope?.type === 'TENANT') {
        isTenant = true;
      } else if (ra.scope?.type === 'PROPERTY') {
        this.extractPropertyNamesFromScope(ra.scope, names);
      }
    });

    if (isTenant) return 'Todas las propiedades';
    return names.length > 0 ? [...new Set(names)].join(', ') : 'Sin propiedad asignada';
  }

  private extractPropertyNamesFromScope(scope: any, names: string[]): void {
    if (scope.resources && Array.isArray(scope.resources)) {
      scope.resources.forEach((r: any) => {
        if (r.name) names.push(r.name);
      });
    } else if (scope.resourceIds && Array.isArray(scope.resourceIds)) {
      scope.resourceIds.forEach((id: string) => {
        const p = this.properties().find(prop => prop.id === id);
        if (p) names.push(p.name);
      });
    }
  }

  private checkStaffHasProperty(member: StaffMember, propertyId: string): boolean {
    if (!member.roleAssignments) return false;
    return member.roleAssignments.some((ra: any) => {
      if (ra.scope?.type === 'TENANT') return true;
      return ra.scope?.type === 'PROPERTY' &&
        Array.isArray(ra.scope.resourceIds) &&
        ra.scope.resourceIds.includes(propertyId);
    });
  }

  private isShiftStarted(shift: FixedShiftCard): boolean {
    if (!shift.startDate || !shift.timeRange) return false;

    const [startHour] = shift.timeRange.split('-').map(part => part.trim());
    if (!startHour) return false;

    const startDateTime = new Date(`${shift.startDate}T${startHour}`);
    return !Number.isNaN(startDateTime.getTime()) && startDateTime <= new Date();
  }

  private normalizeText(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }
}
