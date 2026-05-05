import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { FooterComponent } from '@/presentation/shared/components/footer/footer.component';
import { ExperienceDetailComponent } from '../experience-detail/experience-detail.component';
import { EXPERIENCE_CATALOG } from '../experiences.data';
import { ExperienceDetail } from '@/domain/entities/experience.model';

@Component({
  selector: 'app-experience-detail-page',
  standalone: true,
  imports: [ExperienceDetailComponent, FooterComponent],
  templateUrl: './experience-detail-page.html',
  styleUrl: './experience-detail-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienceDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly isLoading = signal(true);
  readonly experience = signal<ExperienceDetail | null>(null);

  constructor() {
    this.route.paramMap
      .pipe(
        map((params) => params.get('id')),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((experienceId) => {
        this.loadExperience(experienceId);
      });
  }

  onBackToExperiences(): void {
    void this.router.navigate(['/experiences']);
  }

  private loadExperience(experienceId: string | null): void {
    this.isLoading.set(true);

    if (!experienceId) {
      this.experience.set(null);
      this.isLoading.set(false);
      return;
    }

    const selectedExperience = EXPERIENCE_CATALOG.find((item) => item.id === experienceId) ?? null;
    this.experience.set(selectedExperience);
    this.isLoading.set(false);
  }
}
