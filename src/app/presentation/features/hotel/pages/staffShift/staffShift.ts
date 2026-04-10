import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { HotelPageLayoutComponent } from '@/presentation/features/hotel/components/hotel-page-layout/hotel-page-layout';

type PreviewTab = 'calendar' | 'fixed';

interface DayAssignment {
  employeeName: string;
  employeeInitials: string;
  propertyName: string;
  shiftName: string;
  shiftTime: string;
}

interface AssignmentDay {
  dateLabel: string;
  assignments: DayAssignment[];
}

interface FixedShiftCard {
  name: string;
  timeRange: string;
  status: 'Activo' | 'Inactivo';
}

@Component({
  selector: 'app-staff-shift',
  standalone: true,
  imports: [HotelPageLayoutComponent],
  templateUrl: './staffShift.html',
  styleUrl: './staffShift.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StaffShiftComponent {
  readonly activeTab = signal<PreviewTab>('calendar');

  readonly assignmentDays: AssignmentDay[] = [
    {
      dateLabel: 'sabado, 11 de abril de 2026',
      assignments: [
        {
          employeeName: 'Ana Torres',
          employeeInitials: 'AT',
          propertyName: 'Hotel Centro',
          shiftName: 'Turno Manana',
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
  ];

  readonly fixedShifts: FixedShiftCard[] = [
    { name: 'Turno Manana', timeRange: '07:00 - 15:00', status: 'Activo' },
    { name: 'Turno Tarde', timeRange: '15:00 - 23:00', status: 'Activo' },
    { name: 'Turno Noche', timeRange: '23:00 - 07:00', status: 'Activo' },
  ];

  showCalendarTab(): void {
    this.activeTab.set('calendar');
  }

  showFixedTab(): void {
    this.activeTab.set('fixed');
  }
}
