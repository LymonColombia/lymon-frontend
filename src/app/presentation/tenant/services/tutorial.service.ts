import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom, Subject } from 'rxjs';

import { UserRepository } from '@/domain/repositories/user.repository';
import { GetPropertiesUseCase } from '@/domain/use-cases/property/get-properties.use-case';
import { ToastService } from '@/presentation/tenant/services/toast.service';
import { Property } from '@/domain/entities/staff.model';

export type TutorialStepType = 'action' | 'info';

export interface TutorialStep {
  type: TutorialStepType;
  title: string;
  description: string;
  icon: string;
  requiresProperty: boolean;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    type: 'action',
    title: 'Tus propiedades',
    description:
      'Aquí registras los hoteles o propiedades que administras. Cada propiedad tiene sus propias habitaciones, empleados y configuraciones.',
    icon: 'bootstrapHouseDoorFill',
    requiresProperty: false,
  },
  {
    type: 'action',
    title: 'Habitaciones',
    description:
      'Configura los tipos de habitaciones de tu propiedad: nombre, descripción, precio por noche, capacidad, tipo de camas y amenidades disponibles.',
    icon: 'bootstrapBuilding',
    requiresProperty: true,
  },
  {
    type: 'action',
    title: 'Insumos',
    description:
      'Gestiona los insumos y materiales que utiliza tu hotel. Mantieness un registro actualizado del inventario disponible.',
    icon: 'bootstrapBoxSeam',
    requiresProperty: true,
  },
  {
    type: 'action',
    title: 'Proveedores',
    description:
      'Registra los proveedores de tu hotel para tener un control centralizado de quién suministra cada insumo.',
    icon: 'bootstrapTruck',
    requiresProperty: true,
  },
  {
    type: 'action',
    title: 'Empleados',
    description:
      'Registra a los empleados de tu hotel, asignales roles y mantienes su información actualizada en el sistema.',
    icon: 'bootstrapPersonFillAdd',
    requiresProperty: false,
  },
  {
    type: 'action',
    title: 'Crear turno',
    description:
      'Define los turnos de trabajo de tu hotel: nombre, horario, fechas de vigencia y la propiedad a la que pertenecen.',
    icon: 'bootstrapClockFill',
    requiresProperty: false,
  },
  {
    type: 'action',
    title: 'Asignar turno',
    description:
      'Asígnale un turno a cada empleado para organizar los horarios de trabajo de tu equipo.',
    icon: 'bootstrapPersonCheck',
    requiresProperty: false,
  },
  {
    type: 'info',
    title: 'Reservas',
    description:
      'Visualiza y gestiona todas las reservas de tus propiedades: nuevas solicitudes, check-in, check-out y estados de cada reserva en tiempo real.',
    icon: 'bootstrapCalendar3',
    requiresProperty: false,
  },
  {
    type: 'info',
    title: 'Gestión de empleados',
    description:
      'Consulta el estado y la actividad de tus empleados, revisa sus turnos asignados y gestiona su información laboral.',
    icon: 'bootstrapPeopleFill',
    requiresProperty: false,
  },
  {
    type: 'info',
    title: 'Auditoría',
    description:
      'Accede al historial completo de acciones realizadas en el sistema: quién hizo qué y cuándo. Útil para control y trazabilidad.',
    icon: 'bootstrapClipboardData',
    requiresProperty: false,
  },
  {
    type: 'info',
    title: 'Novedades laborales',
    description:
      'Registra y consulta novedades del personal: ausencias, permisos, incidencias u otros eventos relevantes del equipo.',
    icon: 'bootstrapExclamationTriangle',
    requiresProperty: false,
  },
];

@Injectable({ providedIn: 'root' })
export class TutorialService {
  private readonly router = inject(Router);
  private readonly userRepository = inject(UserRepository);
  private readonly getPropertiesUseCase = inject(GetPropertiesUseCase);
  private readonly toastService = inject(ToastService);

  readonly steps = TUTORIAL_STEPS;
  readonly totalSteps = TUTORIAL_STEPS.length;

  readonly isActive = signal(false);
  readonly currentStep = signal<number>(0);
  readonly tutorialCompleted = signal<boolean>(false);
  readonly actionButtonClicked = signal<Set<number>>(new Set());
  readonly requestedShiftModal = signal<'create' | 'assign' | null>(null);
  readonly requestedInventoryTab = signal<'supplies' | 'providers' | null>(null);

  readonly stepCompleted$ = new Subject<void>();

  private processing = false;

  constructor() {
    this.stepCompleted$.subscribe(() => this.onStepCompleted());
  }

  start(): void {
    this.isActive.set(true);
    this.actionButtonClicked.set(new Set());
    this.goToStep(0);
  }

  nextStep(): void {
    if (this.processing) return;
    this.goToStep(this.currentStep() + 1);
  }

  previousStep(): void {
    if (this.processing) return;
    this.goToStep(this.currentStep() - 1);
  }

  goToStep(index: number): void {
    if (this.processing) return;

    if (index < 0) {
      this.processing = false;
      this.abandon();
      return;
    }

    if (index >= this.totalSteps) {
      this.processing = false;
      this.finish();
      return;
    }

    this.processing = true;
    this.currentStep.set(index);
    this.actionButtonClicked.update((set) => {
      const next = new Set(set);
      next.delete(index);
      next.delete(index + 1);
      return next;
    });
    this.requestedShiftModal.set(null);
    this.requestedInventoryTab.set(null);

    const step = this.steps[index];

    if (step.requiresProperty) {
      this.navigateToPropertyStep(index);
    } else {
      this.navigateToStep(index, null);
    }
  }

  finish(): void {
    if (this.processing) return;
    this.processing = true;

    this.userRepository.completeTutorial().subscribe({
      next: () => {
        this.isActive.set(false);
        this.tutorialCompleted.set(true);
        this.processing = false;
        this.toastService.success(
          '¡Tutorial completado! Ya podés usar todas las funcionalidades del sistema.',
        );
        this.router.navigate(['/admin/dashboard']);
      },
      error: (err: unknown) => {
        console.error('Error marking tutorial as completed', err);
        this.isActive.set(false);
        this.processing = false;
        this.toastService.error(
          'No se pudo guardar el progreso del tutorial. Podés continuar usando el sistema.',
        );
        this.router.navigate(['/admin/dashboard']);
      },
    });
  }

  abandon(): void {
    this.isActive.set(false);
    this.requestedShiftModal.set(null);
    this.requestedInventoryTab.set(null);
    this.router.navigate(['/admin/dashboard']);
  }

  markActionButtonClicked(step: number): void {
    this.actionButtonClicked.update((set) => {
      const next = new Set(set);
      next.add(step);
      return next;
    });
  }

  resetActionButtonClicked(step: number): void {
    this.actionButtonClicked.update((set) => {
      const next = new Set(set);
      next.delete(step);
      return next;
    });
  }

  clearRequestedShiftModal(): void {
    this.requestedShiftModal.set(null);
  }

  clearRequestedInventoryTab(): void {
    this.requestedInventoryTab.set(null);
  }

  private onStepCompleted(): void {
    if (!this.isActive()) return;
    this.goToStep(this.currentStep() + 1);
  }

  private navigateToPropertyStep(index: number): void {
    firstValueFrom(this.getPropertiesUseCase.execute())
      .then((properties) => this.navigateToStep(index, properties[0] ?? null))
      .catch((err: unknown) => {
        console.error('Error loading properties for tutorial', err);
        this.navigateToStep(index, null);
      });
  }

  private navigateToStep(index: number, firstProperty: Property | null): void {
    const route = this.buildRoute(index, firstProperty);

    if (route.tab) {
      this.requestedInventoryTab.set(route.tab);
    }

    if (route.shiftModal) {
      this.requestedShiftModal.set(route.shiftModal);
    }

    this.router
      .navigate(route.commands, route.extras)
      .then(() => {
        this.processing = false;
      })
      .catch((err: unknown) => {
        console.error('Tutorial navigation failed', err);
        this.processing = false;
      });
  }

  private buildRoute(
    index: number,
    firstProperty: Property | null,
  ): {
    commands: unknown[];
    extras?: Record<string, unknown>;
    tab?: 'supplies' | 'providers';
    shiftModal?: 'create' | 'assign';
  } {
    const propertyId = firstProperty?.id;
    const propertiesRoute = { commands: ['/admin/properties'] };

    if (!propertyId && index >= 1 && index <= 3) {
      return propertiesRoute;
    }

    switch (index) {
      case 0:
        return propertiesRoute;
      case 1:
        return {
          commands: ['/admin/property-units'],
          extras: { queryParams: { propertyId: propertyId as string } },
        };
      case 2:
        return this.inventoryRoute(propertyId as string, 'supplies');
      case 3:
        return this.inventoryRoute(propertyId as string, 'providers');
      case 4:
        return { commands: ['/admin/register-employee'] };
      case 5:
        return this.shiftRoute('create');
      case 6:
        return this.shiftRoute('assign');
      case 7:
        return { commands: ['/admin/tenant-reservations'] };
      case 8:
        return { commands: ['/admin/employee-management'] };
      case 9:
        return { commands: ['/admin/audit-log'] };
      case 10:
        return { commands: ['/admin/incident-report/list'] };
      default:
        return { commands: ['/admin/dashboard'] };
    }
  }

  private inventoryRoute(
    propertyId: string,
    tab: 'supplies' | 'providers',
  ): { commands: unknown[]; tab: 'supplies' | 'providers' } {
    return {
      commands: ['/admin/properties', propertyId, 'inventory'],
      tab,
    };
  }

  private shiftRoute(
    shiftModal: 'create' | 'assign',
  ): { commands: unknown[]; shiftModal: 'create' | 'assign' } {
    return {
      commands: ['/admin/staff-shift'],
      shiftModal,
    };
  }
}
