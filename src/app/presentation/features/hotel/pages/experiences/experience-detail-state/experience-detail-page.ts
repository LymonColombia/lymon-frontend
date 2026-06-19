import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { FooterComponent } from '@/presentation/shared/components/footer/footer.component';
import { ExperienceDetailComponent } from '../experience-detail-page/experience-detail.component';
import { HeaderComponent } from "@/presentation/shared/components/header/header.component";
import { ButtonComponent } from "@/presentation/shared/components/button/button.component";
import { NgIcon, provideIcons } from "@ng-icons/core";
import { bootstrapChevronLeft } from '@ng-icons/bootstrap-icons';
import { GetGuestExperienceByIdUseCase } from '@/domain/use-cases/experience/get-guest-experience-by-id.use-case';
import { GuestExperience } from '@/domain/entities/guest-experience.model';

@Component({
  selector: 'app-experience-detail-page',
  standalone: true,
  imports: [ExperienceDetailComponent, FooterComponent, HeaderComponent, ButtonComponent, NgIcon],
  providers: [provideIcons({ bootstrapChevronLeft })],
  templateUrl: './experience-detail-page.html',
  styleUrl: './experience-detail-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienceDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly getGuestExperienceByIdUseCase = inject(GetGuestExperienceByIdUseCase);

  readonly isLoading = signal(true);
  readonly experience = signal<GuestExperience | null>(null);

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

    if (!experienceId) {
      this.experience.set(null);
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);

    this.getGuestExperienceByIdUseCase
      .execute(experienceId)
      .subscribe({
        next:(response)=>{
          this.isLoading.set(false)
          this.experience.set(response);
          console.log(this.experience)
        },
        error:(err)=>{
          console.error('Error cargando experiencia:', err);
          this.experience.set(null);
          this.isLoading.set(false)
        }
      }
        
      );
  }
}
