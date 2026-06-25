import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapPeople, bootstrapTrash, bootstrapSearch, bootstrapChevronLeft, bootstrapChevronRight, bootstrapX, bootstrapEnvelope, bootstrapShieldCheck, bootstrapCalendar3, bootstrapPersonBadge, bootstrapClipboard } from '@ng-icons/bootstrap-icons';
import { forkJoin } from 'rxjs';

import { GetStaffUseCase } from '@/domain/use-cases/staff/get-staff.use-case';
import { DeleteStaffUseCase } from '@/domain/use-cases/staff/delete-staff.use-case';
import { GetRolesUseCase } from '@/domain/use-cases/staff/get-roles.use-case';
import { Role, StaffMember } from '@/domain/entities/staff.model';
import {
  EMPLOYEE_MESSAGES,
  getEmployeeRoleLabel,
} from '@/domain/constants/employee-messages.constants';
import { HotelPageLayoutComponent } from '@/presentation/features/hotel/components/hotel-page-layout/hotel-page-layout';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { ToastComponent } from '@/presentation/shared/components/toast/toast.component';
import { ToastService } from '@/presentation/shared/services/toast.service';

interface EmployeeRow {
  id: string;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'STAFF';
  status: 'ACTIVO' | 'INACTIVO';
  createdAt: string;
  document: string;
}

@Component({
  selector: 'app-staff-management',
  standalone: true,
  imports: [HotelPageLayoutComponent, NgIcon, ButtonComponent, ToastComponent],
  providers: [provideIcons({ 
    bootstrapPeople, 
    bootstrapTrash, 
    bootstrapSearch, 
    bootstrapChevronLeft, 
    bootstrapChevronRight,
    bootstrapX,
    bootstrapEnvelope,
    bootstrapShieldCheck,
    bootstrapCalendar3,
    bootstrapPersonBadge,
    bootstrapClipboard
  })],
  templateUrl: './staffManagement.html',
  styleUrl: './staffManagement.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StaffManagementComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly getStaffUseCase = inject(GetStaffUseCase);
  private readonly getRolesUseCase = inject(GetRolesUseCase);
  private readonly deleteStaffUseCase = inject(DeleteStaffUseCase);
  private readonly toastService = inject(ToastService);

  readonly isLoading = signal(true);
  readonly isDeleting = signal<string | null>(null);
  readonly isConfirmDeleteModalOpen = signal(false);
  readonly isDetailsModalOpen = signal(false);
  readonly employeeToDelete = signal<EmployeeRow | null>(null);
  readonly selectedEmployee = signal<EmployeeRow | null>(null);
  readonly copyNotification = signal<{ show: boolean; message: string }>({ show: false, message: '' });
  readonly errorMessage = signal<string | null>(null);
  readonly employees = signal<EmployeeRow[]>([]);
  readonly messages = EMPLOYEE_MESSAGES;
  readonly searchQuery = signal('');
  readonly selectedLetter = signal<string | null>(null);
  readonly roles = signal<Role[]>([]);

  readonly currentPage = signal(1);
  readonly itemsPerPage = 10;

  readonly alphabet = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');

  readonly filteredEmployeesList = computed(() => {
    const query = this.normalizeText(this.searchQuery());
    const letter = this.selectedLetter();
    let list = this.employees();

    if (letter) {
      list = list.filter((employee) => {
        const firstLetter = this.normalizeText(employee.fullName.charAt(0));
        return firstLetter === this.normalizeText(letter);
      });
    }

    if (!query) return list;

    return list.filter((employee) => {
      const fullName = this.normalizeText(employee.fullName);
      const email = this.normalizeText(employee.email);
      const role = this.normalizeText(employee.role);
      const roleLabel = this.normalizeText(this.roleLabel(employee.role));

      return fullName.includes(query) || email.includes(query) || role.includes(query) || roleLabel.includes(query);
    });
  });

  readonly totalEmployees = computed(() => this.filteredEmployeesList().length);

  readonly totalPages = computed(() => Math.ceil(this.totalEmployees() / this.itemsPerPage));

  readonly filteredEmployees = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredEmployeesList().slice(start, end);
  });

  readonly showingFrom = computed(() => (this.totalEmployees() === 0 ? 0 : (this.currentPage() - 1) * this.itemsPerPage + 1));
  readonly showingTo = computed(() => Math.min(this.currentPage() * this.itemsPerPage, this.totalEmployees()));

  readonly activeEmployees = computed(() =>
    this.filteredEmployeesList().filter((employee) => employee.status === 'ACTIVO').length,
  );

  readonly pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    let start = Math.max(1, current - 2);
    let end = Math.min(total, start + 4);

    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  });

  ngOnInit(): void {
    this.refreshStaff();
  }

  refreshStaff(): void {
    this.isLoading.set(true);

    forkJoin({
      staff: this.getStaffUseCase.execute(),
      roles: this.getRolesUseCase.execute(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ staff, roles }) => {
          this.roles.set(roles);
          this.employees.set(staff.map((item, index) => this.toEmployeeRow(item, index)));
          this.isLoading.set(false);
          this.errorMessage.set(null);
        },
        error: () => {
          this.errorMessage.set(EMPLOYEE_MESSAGES.error.loadEmployees);
          this.isLoading.set(false);
        },
      });
  }

  openConfirmDelete(employee: EmployeeRow): void {
    this.employeeToDelete.set(employee);
    this.isConfirmDeleteModalOpen.set(true);
  }

  openDetails(employee: EmployeeRow): void {
    this.selectedEmployee.set(employee);
    this.isDetailsModalOpen.set(true);
  }

  closeDetails(): void {
    this.isDetailsModalOpen.set(false);
    this.selectedEmployee.set(null);
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.copyNotification.set({ show: true, message: EMPLOYEE_MESSAGES.copy });
      setTimeout(() => {
        this.copyNotification.set({ show: false, message: '' });
      }, 2500);
    });
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
          this.toastService.success(EMPLOYEE_MESSAGES.success.delete);
          this.refreshStaff();
        },
        error: () => {
          this.isDeleting.set(null);
          this.toastService.error(EMPLOYEE_MESSAGES.error.deleteEmployee);
        },
      });
  }

  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
    this.currentPage.set(1);
  }

  selectLetter(letter: string | null): void {
    this.selectedLetter.set(letter);
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  roleLabel(role: string): string {
    return getEmployeeRoleLabel(role);
  }

  private normalizeText(text: string): string {
    return (text ?? '')
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
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
    const fullName =
      (staff.fullName ?? staff.name ?? '').trim() || this.getNameFromEmail(staff.email);

    const adminRole = this.roles().find((r) => r.name.toUpperCase() === 'ADMIN');

    const isAdmin = staff.roleAssignments?.some(
      (assignment) => assignment.roleId === adminRole?.id,
    );

    return {
      id: staff.id ?? `staff-${index}`,
      fullName,
      email: staff.email,
      role: isAdmin ? 'ADMIN' : 'STAFF',
      status: 'ACTIVO',
      createdAt: staff.createdAt ?? '',
      document: (staff as any).document ?? 'No registrado',
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
