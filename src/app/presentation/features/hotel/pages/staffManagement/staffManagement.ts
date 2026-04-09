import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { provideIcons } from '@ng-icons/core';
import { bootstrapPeople } from '@ng-icons/bootstrap-icons';

import { GetStaffUseCase } from '@/domain/use-cases/staff/get-staff.use-case';
import { StaffMember } from '@/domain/entities/staff.model';
import { HotelPageLayoutComponent } from '@/presentation/features/hotel/components/hotel-page-layout/hotel-page-layout';

interface EmployeeRow {
  id: string;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'STAFF';
  status: 'ACTIVO' | 'INACTIVO';
  createdAt: string;
}

@Component({
  selector: 'app-staff-management',
  standalone: true,
  imports: [HotelPageLayoutComponent],
  providers: [provideIcons({ bootstrapPeople })],
  templateUrl: './staffManagement.html',
  styleUrl: './staffManagement.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StaffManagementComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly getStaffUseCase = inject(GetStaffUseCase);

  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly employees = signal<EmployeeRow[]>([]);

  readonly totalEmployees = computed(() => this.employees().length);
  readonly activeEmployees = computed(() =>
    this.employees().filter((employee) => employee.status === 'ACTIVO').length,
  );

  ngOnInit(): void {
    this.getStaffUseCase
      .execute()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (staff) => {
          this.employees.set(staff.map((item, index) => this.toEmployeeRow(item, index)));
          this.isLoading.set(false);
        },
        error: () => {
          this.errorMessage.set('No fue posible cargar los empleados registrados.');
          this.isLoading.set(false);
        },
      });
  }

  formatDate(dateISO: string): string {
    if (!dateISO) return 'Sin fecha';

    return new Date(dateISO).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  private toEmployeeRow(staff: StaffMember, index: number): EmployeeRow {
    const fullName = (staff.fullName ?? staff.name ?? '').trim() || this.getNameFromEmail(staff.email);
    return {
      id: staff.id ?? `staff-${index}`,
      fullName,
      email: staff.email,
      role: staff.role === 'ADMIN' ? 'ADMIN' : 'STAFF',
      // Backend does not send status yet.
      status: 'ACTIVO',
      createdAt: staff.createdAt ?? '',
    };
  }

  private getNameFromEmail(email: string): string {
    const prefix = email.split('@')[0] ?? 'Usuario';
    return prefix
      .split(/[._-]+/)
      .filter(Boolean)
      .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
      .join(' ');
  }
}
