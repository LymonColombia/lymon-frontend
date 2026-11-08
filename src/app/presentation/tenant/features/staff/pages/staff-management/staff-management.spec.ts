import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { StaffManagementComponent } from './staff-management';
import { GetStaffUseCase } from '@/domain/tenant/staff/use-cases/get-staff.use-case';
import { GetRolesUseCase } from '@/domain/tenant/staff/use-cases/get-roles.use-case';
import { DeleteStaffUseCase } from '@/domain/tenant/staff/use-cases/delete-staff.use-case';

describe('StaffManagementComponent — navigateToRegister (LYMON-1149)', () => {
  it('should navigate to /admin/staff/new when navigateToRegister is called', async () => {
    await TestBed.configureTestingModule({
      imports: [StaffManagementComponent],
      providers: [
        provideRouter([]),
        { provide: GetStaffUseCase, useValue: { execute: vi.fn().mockReturnValue(of([])) } },
        { provide: GetRolesUseCase, useValue: { execute: vi.fn().mockReturnValue(of([])) } },
        { provide: DeleteStaffUseCase, useValue: { execute: vi.fn() } },
      ],
    }).compileComponents();
    const navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(StaffManagementComponent);
    fixture.detectChanges();

    fixture.componentInstance.navigateToRegister();

    expect(navigateSpy).toHaveBeenCalledWith(['/admin/staff/new']);
  });
});
