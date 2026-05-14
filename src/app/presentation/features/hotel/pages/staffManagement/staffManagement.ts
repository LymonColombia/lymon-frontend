import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapPeople, bootstrapTrash } from '@ng-icons/bootstrap-icons';

import { GetStaffUseCase } from '@/domain/use-cases/staff/get-staff.use-case';
import { DeleteStaffUseCase } from '@/domain/use-cases/staff/delete-staff.use-case';
import { StaffMember } from '@/domain/entities/staff.model';
import { HotelPageLayoutComponent } from '@/presentation/features/hotel/components/hotel-page-layout/hotel-page-layout';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';

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
  imports: [HotelPageLayoutComponent, NgIcon, ButtonComponent],
  providers: [provideIcons({ bootstrapPeople, bootstrapTrash })],
  templateUrl: './staffManagement.html',
  styleUrl: './staffManagement.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StaffManagementComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly getStaffUseCase = inject(GetStaffUseCase);
  private readonly deleteStaffUseCase = inject(DeleteStaffUseCase);

  readonly isLoading = signal(true);
  readonly isDeleting = signal<string | null>(null);
  readonly isConfirmDeleteModalOpen = signal(false);
  readonly employeeToDelete = signal<EmployeeRow | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly employees = signal<EmployeeRow[]>([]);

  readonly totalEmployees = computed(() => this.employees().length);
  readonly activeEmployees = computed(() =>
    this.employees().filter((employee) => employee.status === 'ACTIVO').length,
  );

  ngOnInit(): void {
    this.refreshStaff();
  }

  refreshStaff(): void {
    this.isLoading.set(true);
    this.getStaffUseCase
      .execute()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (staff) => {
          this.employees.set(staff.map((item, index) => this.toEmployeeRow(item, index)));
          this.isLoading.set(false);
          this.errorMessage.set(null);
        },
        error: () => {
          this.errorMessage.set('No fue posible cargar los empleados registrados.');
          this.isLoading.set(false);
        },
      });
  }

  openConfirmDelete(employee: EmployeeRow): void {
    this.employeeToDelete.set(employee);
    this.isConfirmDeleteModalOpen.set(true);
  }

  closeConfirmDelete(): void {
    this.isConfirmDeleteModalOpen.set(false);
    this.employeeToDelete.set(null);
  }

  confirmDeleteStaff(): void {
    const employee = this.employeeToDelete();
    if (!employee) return;

    const id = employee.id;
    this.isDeleting.set(id);
    this.deleteStaffUseCase
      .execute(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isDeleting.set(null);
          this.closeConfirmDelete();
          this.refreshStaff();
        },
        error: () => {
          this.isDeleting.set(null);
          this.errorMessage.set('Ocurrió un error al intentar eliminar el empleado.');
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
