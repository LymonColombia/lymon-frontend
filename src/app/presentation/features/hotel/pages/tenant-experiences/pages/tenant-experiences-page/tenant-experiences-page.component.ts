import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapGrid, bootstrapListUl, bootstrapPlus, bootstrapStars } from '@ng-icons/bootstrap-icons';
import { Experience} from '@/domain/entities/experience.model';
import {
  HotelPageActionsDirective,
  HotelPageLayoutComponent,
  HotelPageMetaDirective,
} from '@/presentation/features/hotel/components/hotel-page-layout/hotel-page-layout';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { ExperienceCardComponent } from '../../components/experience-card/experience-card.component';
import { ExperienceTableComponent } from '../../components/experience-table/experience-table.component';
import { TenantExperienceLocalStoreService } from '../../tenant-experience-local-store.service';

type ExperienceViewMode = 'CARDS' | 'TABLE';

@Component({
  selector: 'app-tenant-experiences-page',
  standalone: true,
  imports: [
    HotelPageLayoutComponent,
    HotelPageMetaDirective,
    HotelPageActionsDirective,
    ButtonComponent,
    ExperienceCardComponent,
    ExperienceTableComponent,
    NgIcon
],
  providers: [provideIcons({ bootstrapStars, bootstrapPlus, bootstrapGrid, bootstrapListUl })],
  templateUrl: './tenant-experiences-page.component.html',
  styleUrl: './tenant-experiences-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantExperiencesPageComponent {
  private readonly router = inject(Router);
  private readonly localStore = inject(TenantExperienceLocalStoreService);

  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly experiences = signal<Experience[]>([]);
  readonly viewMode = signal<ExperienceViewMode>('CARDS');

  readonly experienceCountLabel = computed(() => {
    if (this.isLoading()) {
      return 'Cargando experiencias...';
    }

    const count = this.experiences().length;
    return `${count} experiencia${count === 1 ? '' : 's'} registradas`;
  });

  constructor() {
    this.loadExperiences();
  }

  setViewMode(mode: ExperienceViewMode): void {
    this.viewMode.set(mode);
  }

  onDeleteExperience(id: string) {
  throw new Error('Method not implemented.');
  }

  onCreateExperience(): void {
    this.router.navigate(['/tenant-experiences/new']);
  }

  onViewExperience(id: string): void {
    this.router.navigate(['/tenant-experiences', id]);
  }

  onEditExperience(id: string): void {
    this.router.navigate(['/tenant-experiences', id, 'edit']);
  }

  private loadExperiences(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.localStore.list().subscribe({
      next: (experiences) => {
        this.experiences.set(experiences);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudieron cargar las experiencias.');
        this.isLoading.set(false);
      },
    });
  }
}
